// Device-local storage.
//
// Paintings are kept as Blobs under their own key, and piece metadata lives
// in its own store. Saving one piece writes one small record and one blob —
// earlier versions kept every image inline in a single array, so each save
// rewrote the whole Folio.

const DB_NAME = 'innerworld';
const DB_VERSION = 2;

const STORE_META = 'meta';
const STORE_PIECES = 'pieces';
const STORE_IMAGES = 'images';

let db = null;
export let available = false;

export async function open() {
  if (db) return db;
  db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const handle = request.result;
      if (!handle.objectStoreNames.contains(STORE_META)) handle.createObjectStore(STORE_META);
      if (!handle.objectStoreNames.contains(STORE_IMAGES)) handle.createObjectStore(STORE_IMAGES);
      if (!handle.objectStoreNames.contains(STORE_PIECES)) {
        const pieces = handle.createObjectStore(STORE_PIECES, { keyPath: 'id' });
        pieces.createIndex('day', 'day');
        pieces.createIndex('chapter', 'chapter');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage is blocked by another open tab.'));
  });
  available = true;
  return db;
}

function run(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Storage unavailable'));
      return;
    }
    const tx = db.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ── preferences and other single values ──────────────────────────────────

export const meta = {
  get: (key) => run(STORE_META, 'readonly', (store) => store.get(key)),
  set: (key, value) => run(STORE_META, 'readwrite', (store) => store.put(value, key)),
  remove: (key) => run(STORE_META, 'readwrite', (store) => store.delete(key)),
};

// ── pieces ───────────────────────────────────────────────────────────────

export const pieces = {
  all: () => run(STORE_PIECES, 'readonly', (store) => store.getAll()),
  get: (id) => run(STORE_PIECES, 'readonly', (store) => store.get(id)),
  put: (piece) => run(STORE_PIECES, 'readwrite', (store) => store.put(stripBytes(piece))),
  remove: (id) => run(STORE_PIECES, 'readwrite', (store) => store.delete(id)),
};

// Metadata only. A Blob that slipped into a piece record would put us back
// where we started.
function stripBytes(piece) {
  const copy = { ...piece };
  delete copy.blob;
  delete copy.objectUrl;
  return copy;
}

// ── paintings ────────────────────────────────────────────────────────────

export const images = {
  get: (id) => run(STORE_IMAGES, 'readonly', (store) => store.get(id)),
  put: (id, blob) => run(STORE_IMAGES, 'readwrite', (store) => store.put(blob, id)),
  remove: (id) => run(STORE_IMAGES, 'readwrite', (store) => store.delete(id)),
};

// Object URLs are revoked when a piece's view goes away, so a long Folio
// session does not leak every painting it has shown.
const urls = new Map();

export async function imageUrl(id) {
  if (urls.has(id)) return urls.get(id);
  const blob = await images.get(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

export function releaseImageUrl(id) {
  const url = urls.get(id);
  if (!url) return;
  URL.revokeObjectURL(url);
  urls.delete(id);
}

export function releaseAllImageUrls() {
  for (const id of [...urls.keys()]) releaseImageUrl(id);
}

export async function removePiece(id) {
  releaseImageUrl(id);
  await pieces.remove(id);
  await images.remove(id);
}

// ── estimates and export ─────────────────────────────────────────────────

export async function usage() {
  if (!navigator.storage || !navigator.storage.estimate) return null;
  try {
    const { usage: used, quota } = await navigator.storage.estimate();
    return { used, quota, share: quota ? used / quota : null };
  } catch {
    return null;
  }
}

// A backup carries private text. The caller warns before writing it out.
export async function exportBackup({ includeImages = false } = {}) {
  const [allPieces, preferences, chapters] = await Promise.all([
    pieces.all(),
    meta.get('preferences'),
    meta.get('chapters'),
  ]);
  const payload = {
    format: 'innerworld-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    preferences: preferences || null,
    chapters: chapters || null,
    pieces: allPieces,
  };
  if (includeImages) {
    payload.images = {};
    for (const piece of allPieces) {
      const blob = await images.get(piece.id);
      if (blob) payload.images[piece.id] = await blobToDataUrl(blob);
    }
  }
  return payload;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
