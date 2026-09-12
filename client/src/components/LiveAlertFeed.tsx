import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { LiveAlert } from "../types";

const SEVERITY_STYLE: Record<LiveAlert["severity"], string> = {
  critical: "border-critical/40 bg-critical/10 text-critical",
  high: "border-high/40 bg-high/10 text-high",
  watch: "border-watch/40 bg-watch/10 text-watch",
  info: "border-panelBorder bg-abyss text-mist",
};

const SEVERITY_ICON: Record<LiveAlert["severity"], string> = {
  critical: "🔴",
  high: "🟠",
  watch: "🟡",
  info: "🔵",
};

export default function LiveAlertFeed() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onAlert = (alert: LiveAlert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 8));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("alert", onAlert);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("alert", onAlert);
    };
  }, []);

  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-mist">Live monitoring feed</div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "animate-pulse bg-safe" : "bg-mist/40"}`} />
          <span className={connected ? "text-safe" : "text-mist"}>{connected ? "Live" : "Connecting…"}</span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="py-6 text-center text-xs text-mist">Waiting for the first sensor update…</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`rounded-lg border px-3 py-2 text-xs ${SEVERITY_STYLE[a.severity]}`}>
              <div className="flex items-start gap-2">
                <span>{SEVERITY_ICON[a.severity]}</span>
                <div className="flex-1">
                  <div>{a.message}</div>
                  <div className="mt-0.5 text-[10px] opacity-60">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
