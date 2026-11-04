// Pigments: real historical colour-makers' materials. Each carries its own
// provenance note, which the Make screen shows when it explains a palette.

export const pigments = {
  'yellow-ochre': { name: 'Yellow ochre', hex: '#C8913A', note: 'Iron-rich earth. One of the oldest colours people have painted with.' },
  'raw-sienna': { name: 'Raw sienna', hex: '#B07A3C', note: 'Clay from the hills around Siena, used unroasted.' },
  'naples-yellow': { name: 'Naples yellow', hex: '#E2B566', note: 'Lead antimonate, first found near Vesuvius.' },
  'burnt-umber': { name: 'Burnt umber', hex: '#6B3E22', note: 'Umbrian earth, roasted until it turns warm and deep.' },
  vermilion: { name: 'Vermilion', hex: '#A8432C', note: 'Ground cinnabar. Costly, and for centuries the brightest red available.' },
  'madder-lake': { name: 'Madder lake', hex: '#8E4257', note: 'Dye drawn from madder root and fixed onto a pale base.' },
  indigo: { name: 'Indigo', hex: '#2E3560', note: 'Fermented from Indigofera leaves, then pressed into cakes.' },
  ultramarine: { name: 'Ultramarine', hex: '#2E3F7A', note: 'Ground lapis lazuli, carried overland from Afghanistan.' },
  viridian: { name: 'Viridian', hex: '#33684E', note: 'Chromium oxide, introduced to painters in 1859.' },
  malachite: { name: 'Malachite', hex: '#3D6A58', note: 'Ground copper carbonate, the green of early wall painting.' },
  'lead-white': { name: 'Lead white', hex: '#EDE4D3', note: 'Lead stacked over vinegar until a white crust formed.' },
  'bone-black': { name: 'Bone black', hex: '#241F1A', note: 'Charred bone, ground fine. Warmer than lamp black.' },
};

// How a chosen feeling word reaches the palette. Resonance picks colour;
// taste (medium and mark) only changes how the paint is laid down.
export const feelings = [
  { id: 'calm', label: 'Calm', pigment: 'indigo' },
  { id: 'tender', label: 'Tender', pigment: 'lead-white' },
  { id: 'restless', label: 'Restless', pigment: 'vermilion' },
  { id: 'bright', label: 'Bright', pigment: 'naples-yellow' },
  { id: 'heavy', label: 'Heavy', pigment: 'burnt-umber' },
  { id: 'curious', label: 'Curious', pigment: 'viridian' },
  { id: 'adrift', label: 'Adrift', pigment: 'ultramarine' },
  { id: 'sore', label: 'Sore', pigment: 'madder-lake' },
];

export const MAX_FEELINGS = 2;

// The three ways into a day. One accent per way, used everywhere that way
// appears — nav, tile, player, chapter grid — so the colour means one thing.
export const ways = {
  read: { label: 'Read', accent: '#C8913A', verb: 'Read' },
  drift: { label: 'Drift', accent: '#8E7BB8', verb: 'Listen' },
  wander: { label: 'Wander', accent: '#5E8A6E', verb: 'Walk' },
};

export const markStyles = [
  { id: 'wash', label: 'Wash', note: 'Broad translucent fields that pool and overlap.' },
  { id: 'grain', label: 'Grain', note: 'Dry pigment scattered, like chalk dragged over tooth.' },
  { id: 'line', label: 'Line', note: 'Few marks, drawn. More paper than paint.' },
];

export const defaults = {
  mark: 'wash',
  painter: 'local',
  textSize: 1,
  textOnly: false,
};
