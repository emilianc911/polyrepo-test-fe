# polyrepo-test-fe

Frontend half of the polyrepo demo: a small but real React SPA for a project-management tool. Pairs with [`polyrepo-test-be`](https://github.com/emilianc911/polyrepo-test-be) over HTTP and WebSocket.

- **Stack:** React 18 + Vite 5 + **TypeScript** + **Tailwind CSS**
- **Routing:** React Router v6 with a protected layout
- **Server state:** TanStack Query
- **Realtime:** native WebSocket; auto-reconnect with backoff
- **Auth:** JWT in localStorage, attached as `Authorization: Bearer …`
- **Build artifact:** static files served by nginx 1.27, which also reverse-proxies `/api` and `/ws` to the BE

## What you can do

- Register / login / logout
- Create projects (each user owns their projects)
- Open a project to see a 3-column Kanban board (todo / in progress / done)
- Add tasks with priority + status, change status from the card or the modal
- Click a task to view it in a side panel: comments thread + file uploads
- File uploads go directly to MinIO via presigned PUT URLs
- A live indicator in the header shows when the WebSocket is connected
- Open two browser tabs at the same project — every change in one shows up in the other in real time

## Run locally with Docker

Prerequisite: Docker + Compose v2, and the BE repo already running.

```bash
docker network create polyrepo-shared || true

# 1) start the BE first (api + worker + db + redis + minio + mailhog)
( cd ../polyrepo-test-be && docker compose up -d --build )

# 2) start the FE
docker compose up -d --build

# 3) open the app
open http://localhost:8080
```

The seeded demo account (`demo@polyrepo.local` / `demo1234`) is auto-filled on the login page.

`BACKEND_URL` defaults to `http://api:4000`, which resolves over the shared `polyrepo-shared` network. Override it for staging/prod:

```bash
BACKEND_URL=https://my-staging-api.example.com docker compose up -d --build
```

## Run locally without Docker

```bash
npm install
# Have the BE running on :4000 (any way you like — `cd ../polyrepo-test-be && docker compose up`).
VITE_API_TARGET=http://localhost:4000 npm run dev
# open http://localhost:5173
```

## Architecture

```
┌────────────┐   HTTP    ┌──────────────┐    HTTP/WS    ┌──────────────┐
│  browser   │ ────────► │ nginx (this) │ ─────────────►│ Express API  │
│   :8080    │           │  /api  /ws   │               │   :4000      │
└────────────┘           └──────────────┘               └──────┬───────┘
                                                               │
                                              ┌────────────────┼────────────────┐
                                              ▼                ▼                ▼
                                          ┌────────┐      ┌────────┐      ┌────────────┐
                                          │ Postgres│      │ Redis  │      │ MinIO (S3) │
                                          └────────┘      └────────┘      └────────────┘
```

The SPA never needs to know the absolute BE URL — it always calls `fetch("/api/…")` and opens `WebSocket("/ws")`. Two layers of proxying make that work:

1. **Production** (this Dockerfile): nginx + `nginx.conf.template`. `entrypoint.sh` runs `envsubst` on `${BACKEND_URL}` at container start, so the same image works against any BE host.
2. **Dev** (`npm run dev`): Vite's dev server proxies `/api` and `/ws` to `${VITE_API_TARGET}`.

File uploads bypass the BE proxy: the BE returns a presigned URL pointing at `S3_PUBLIC_ENDPOINT` (default `http://localhost:9000`), and the browser PUTs the file directly to MinIO.

## Layout

```
polyrepo-test-fe/
├── Dockerfile               # node build → nginx serve
├── docker-compose.yml
├── nginx.conf.template      # ${BACKEND_URL} substituted at runtime
├── entrypoint.sh            # envsubst then exec nginx
├── package.json
├── tsconfig*.json
├── vite.config.ts           # /api + /ws proxy for dev
├── tailwind.config.ts
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx             # ReactDOM root + BrowserRouter
    ├── App.tsx              # router + global providers (Query, Auth, Toast)
    ├── index.css            # Tailwind directives
    ├── auth/
    │   ├── AuthContext.tsx  # login / register / logout / hydrate from token
    │   └── ProtectedRoute.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── DashboardPage.tsx   # list of projects
    │   └── ProjectPage.tsx     # Kanban board + task detail
    ├── components/
    │   ├── Layout.tsx       # header + outlet
    │   ├── AuthCard.tsx     # shared form chrome
    │   ├── TaskCard.tsx
    │   └── TaskDetail.tsx   # modal: comments + attachments
    ├── lib/
    │   ├── api.ts           # typed fetch client + ApiError
    │   ├── ws.ts            # useProjectSocket hook (auto-reconnect)
    │   ├── toast.tsx        # provider + useToast
    │   └── token.ts         # localStorage helpers
    └── types/
        └── api.ts           # shared with BE shape (User/Project/Task/...)
```

## Configuration

| Variable          | Where used   | Default                  | Notes                                     |
| ----------------- | ------------ | ------------------------ | ----------------------------------------- |
| `WEB_PORT`        | docker host  | `8080`                   | Host-side port for nginx                  |
| `BACKEND_URL`     | nginx (prod) | `http://api:4000`        | Where `/api/*` and `/ws` are forwarded    |
| `VITE_API_TARGET` | vite (dev)   | `http://localhost:4000`  | Where `npm run dev` proxies `/api` and `/ws` |
