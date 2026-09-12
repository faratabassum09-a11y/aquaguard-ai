import { Anomaly } from "../types";

const SEVERITY_STYLE: Record<Anomaly["severity"], string> = {
  high: "border-critical/40 bg-critical/10 text-critical",
  medium: "border-high/40 bg-high/10 text-high",
};

export default function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-mist">
        <span className="h-2 w-2 rounded-full bg-waterblue" />
        Automatic anomaly detection
      </div>
      <p className="mb-3 text-xs text-mist/80">
        Statistical detection (z-score + month-over-month change) over this lake's real measurement
        history — not AI-generated, fully explainable.
      </p>

      {anomalies.length === 0 ? (
        <div className="rounded-lg border border-safe/30 bg-safe/5 px-3 py-3 text-sm text-safe">
          ✅ No statistical anomalies detected in the current data — all metrics within expected range.
        </div>
      ) : (
        <div className="space-y-2">
          {anomalies.map((a) => (
            <div key={a.metric} className={`rounded-lg border px-3 py-3 text-sm ${SEVERITY_STYLE[a.severity]}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">{a.label}</span>
                <span className="font-mono text-xs opacity-80">z = {a.zScore}</span>
              </div>
              <div className="text-xs text-slate-200">{a.description}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
                Detected via {a.detectionMethod}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
