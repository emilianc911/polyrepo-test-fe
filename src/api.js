// All requests go through `/api/...` and are proxied to the backend by:
//   - vite dev server (see vite.config.js -> server.proxy)
//   - nginx in production (see nginx.conf.template -> location /api)
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/health"),
  list: () => request("/todos"),
  create: (title) =>
    request("/todos", { method: "POST", body: JSON.stringify({ title }) }),
  toggle: (id, done) =>
    request(`/todos/${id}`, { method: "PATCH", body: JSON.stringify({ done }) }),
  remove: (id) => request(`/todos/${id}`, { method: "DELETE" }),
};
