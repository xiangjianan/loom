# Loom

[English](README.md) · [简体中文](README.zh-CN.md)

**Chat with multiple AI models in parallel. Highlight useful passages to guide your next prompt.**

[Open Loom](https://xiangjianan.github.io/loom/)

## Features

- Send one prompt to 1–5 models, each with its own conversation context.
- Highlight model responses and include selected passages in your next question.
- Render Markdown, jump between conversation rounds, and switch between saved chats.
- Discover available models from provider APIs, with manual model entry as a fallback.
- Collapse the sidebar for more reading space.
- English by default, with an English/Chinese switch and a saved language preference.
- Keep model settings, API keys, drafts, highlights, and chat history in browser localStorage.

## Architecture

The frontend is hosted on GitHub Pages. Requests are forwarded by a lightweight Node.js service at `https://relay.minidesk.online:8443/loom` on an Aliyun server. The relay does not save API keys or conversations. Model listing depends on each provider's API and your account permissions.

Browser data belongs to each website origin. The previous Pages path and `/loom/` share an origin and retain the same local data; the original Sites domain has separate storage. Clearing website data removes local records.

## Development

```sh
npm ci
npm run build
npm test
node preview.mjs
```

Open `http://localhost:4173`. Edit `shell.html`, `style.css`, `app.js`, or `i18n.js`, then rebuild and push. GitHub Pages publishes `main` → `/docs`. The generated frontend is self-contained and has no runtime CDN dependency.

## Relay deployment

Server code lives in `api.js` and `relay/`. `npm run build` copies the current API implementation into `relay/api.mjs`. Upload `relay/*.mjs` to `/opt/loom-relay/`, then run `systemctl restart loom-relay`.

The service listens on `127.0.0.1:8791`. Existing Nginx proxies `/loom/` on HTTPS port 8443. Health check: `GET /loom/health`. Deployment templates are included in `relay/`. It rejects private/reserved destination addresses, pins validated DNS results, limits requests to 2 MB, and does not follow upstream redirects. CORS allows the Pages origin, original Sites frontend, and relay origin; CORS is not authentication. Users supply their own provider API keys.

Backend changes require a separate server deployment; publishing Pages updates only the frontend. Never commit real API keys or conversation exports.
