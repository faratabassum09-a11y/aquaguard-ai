import { RiskBand } from "../types";

const CONFIG: Record<RiskBand, { color: string; dot: string; label: string }> = {
  SAFE: { color: "text-safe border-safe/40 bg-safe/10", dot: "bg-safe", label: "Safe" },
  WATCH: { color: "text-watch border-watch/40 bg-watch/10", dot: "bg-watch", label: "Watch" },
  HIGH: { color: "text-high border-high/40 bg-high/10", dot: "bg-high", label: "High" },
  CRITICAL: { color: "text-critical border-critical/40 bg-critical/10", dot: "bg-critical", label: "Critical" },
};

export default function RiskBadge({ band, size = "md" }: { band: RiskBand; size?: "sm" | "md" }) {
  const c = CONFIG[band];
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${c.color} ${pad}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function riskColor(band: RiskBand) {
  return { SAFE: "#35D07F", WATCH: "#F2C94C", HIGH: "#FFB020", CRITICAL: "#FF4D5E" }[band];
}
