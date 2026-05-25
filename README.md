# polyrepo-test-fe

Frontend half of the polyrepo demo: a tiny React + Vite SPA for a TODO list. Pairs with [`polyrepo-test-be`](../polyrepo-test-be) (or any other repo of yours) over HTTP through `/api/...`.

- **Stack:** React 18 + Vite 5 (plain JS, no TypeScript)
- **Build artifact:** static files served by nginx 1.27
- **Backend wiring:** nginx reverse-proxies `/api/*` to `${BACKEND_URL}` at runtime

## Run locally with Docker

Prerequisite: Docker + Docker Compose v2, and the BE repo already running.

```bash
# 1) (one time per host) create the shared network
docker network create polyrepo-shared || true

# 2) start the BE first
( cd ../polyrepo-test-be && docker compose up -d --build )

# 3) start the FE
docker compose up -d --build

# 4) open the app
open http://localhost:8080
```

`BACKEND_URL` defaults to `http://api:4000`, which resolves to the BE compose service through the shared `polyrepo-shared` Docker network. Point it elsewhere if you need to:

```bash
BACKEND_URL=http://my-staging-api.example.com docker compose up -d --build
```

## Run locally without Docker

```bash
npm install
# In another terminal, start the BE on :4000 (any way you like).
VITE_API_TARGET=http://localhost:4000 npm run dev
# open http://localhost:5173
```

## How it talks to the BE

```
┌────────────┐   HTTP   ┌──────────────┐   pg   ┌──────────────┐
│  browser   │ ───────► │ nginx (this) │ ─────► │ Express API  │
│   :8080    │          │  /api/*      │        │   :4000      │
└────────────┘          └──────────────┘        └──────┬───────┘
                                                       │
                                                       ▼
                                                 ┌──────────┐
                                                 │ Postgres │
                                                 │  :5432   │
                                                 └──────────┘
```

Two layers of proxying are configured so the SPA never needs to know the absolute BE URL — it just calls `fetch("/api/todos")`:

1. **In production (this Dockerfile):** nginx with `nginx.conf.template` substitutes `${BACKEND_URL}` at container start (see `entrypoint.sh`) and proxies `/api/` to it.
2. **In dev (`npm run dev`):** Vite's dev server proxies `/api/` to `${VITE_API_TARGET}` (defaults to `http://localhost:4000`).

## Layout

```
polyrepo-test-fe/
├── Dockerfile              # node build → nginx serve
├── docker-compose.yml
├── nginx.conf.template     # ${BACKEND_URL} substituted at runtime
├── entrypoint.sh           # envsubst then exec nginx
├── package.json
├── vite.config.js          # /api proxy for dev mode
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx             # list + add + toggle + delete
    ├── api.js              # fetch wrappers around /api/...
    └── styles.css
```

## Configuration

| Variable          | Where used   | Default              | Notes                                   |
| ----------------- | ------------ | -------------------- | --------------------------------------- |
| `WEB_PORT`        | docker host  | `8080`               | Host-side port for nginx                |
| `BACKEND_URL`     | nginx (prod) | `http://api:4000`    | Where `/api/*` is forwarded             |
| `VITE_API_TARGET` | vite (dev)   | `http://localhost:4000` | Where `npm run dev` proxies `/api/*` |
