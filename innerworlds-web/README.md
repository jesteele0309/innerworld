# Innerworlds — hosted build

A static page plus one server function, ready for Vercel.

- `index.html` — the whole app. Built from `/iw/build.py`; do not edit by hand.
- `api/insight.js` — writes an AI reflection from journal entries. Stores and logs nothing.
- `vercel.json` — security headers. Only the Met's servers are allowed for images and data.

## Deploy

1. In this folder run `npx vercel@latest` and follow the prompts (framework: Other).
2. Run `npx vercel@latest --prod` to publish.

AI reflections use Vercel AI Gateway with the project's own deployment token, so no key is needed.
Model: `anthropic/claude-haiku-5.5`. Set a spend budget for AI Gateway in the Vercel dashboard;
the function's own limit (10 requests per visitor per hour) is best effort only.
