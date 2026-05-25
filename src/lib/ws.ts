import { useEffect, useRef } from "react";
import type { WsEvent } from "../types/api";
import { tokenStore } from "./token";

function buildWsUrl(): string {
  const token = tokenStore.get();
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  const params = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${proto}://${host}/ws${params}`;
}

// Single connection per project subscribed at a time. The hook
// reconnects automatically on disconnect with simple backoff.
export function useProjectSocket(
  projectId: string | null,
  onEvent: (e: WsEvent) => void,
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!projectId) return;

    let ws: WebSocket | null = null;
    let closed = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (closed) return;
      ws = new WebSocket(buildWsUrl());
      ws.onopen = () => {
        attempt = 0;
        ws?.send(JSON.stringify({ type: "subscribe", projectId }));
      };
      ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data as string) as WsEvent;
          onEventRef.current(event);
        } catch {
          // ignore malformed
        }
      };
      ws.onclose = () => {
        if (closed) return;
        attempt += 1;
        const delay = Math.min(15_000, 500 * 2 ** Math.min(attempt, 5));
        reconnectTimer = setTimeout(connect, delay);
      };
      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [projectId]);
}
