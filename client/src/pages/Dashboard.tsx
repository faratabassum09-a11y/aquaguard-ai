import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getLakes } from "../services/api";
import { Lake } from "../types";
import RiskMap from "../components/RiskMap";
import RiskBadge from "../components/RiskBadge";
import SecurityGauge from "../components/SecurityGauge";
import LiveAlertFeed from "../components/LiveAlertFeed";

export default function Dashboard() {
  const [lakes, setLakes] = useState<Lake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getLakes()
      .then(setLakes)
      .catch(() => setError("Could not reach the AQUAGUARD server. Is the backend running on :5000 and seeded?"))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    CRITICAL: lakes.filter((l) => l.latest?.riskBand === "CRITICAL").length,
    HIGH: lakes.filter((l) => l.latest?.riskBand === "HIGH").length,
    WATCH: lakes.filter((l) => l.latest?.riskBand === "WATCH").length,
    SAFE: lakes.filter((l) => l.latest?.riskBand === "SAFE").length,
  };

  const avg = (key: "droughtRisk" | "pollutionRisk" | "ecosystemStress" | "overallRisk") =>
    lakes.length ? Math.round(lakes.reduce((s, l) => s + (l.latest?.[key] || 0), 0) / lakes.length) : 0;

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center text-slate-300">
        <div className="mb-2 text-2xl">⚠️</div>
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AQUAGUARD AI — Command Center</h1>
          <p className="text-sm text-mist">Hyderabad watershed · {lakes.length} monitored water bodies</p>
        </div>
        <div className="flex gap-3 font-mono text-sm">
          <span className="rounded-full border border-critical/40 bg-critical/10 px-3 py-1 text-critical">
            🔴 {counts.CRITICAL} Critical
          </span>
          <span className="rounded-full border border-high/40 bg-high/10 px-3 py-1 text-high">
            🟠 {counts.HIGH} High
          </span>
          <span className="rounded-full border border-watch/40 bg-watch/10 px-3 py-1 text-watch">
            🟡 {counts.WATCH} Watch
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          to="/regional"
          className="flex-1 min-w-[240px] rounded-xl border border-waterblue/30 bg-waterblue/10 p-4 transition hover:bg-waterblue/15"
        >
          <div className="text-sm font-semibold text-waterblue">🌍 Regional What-If</div>
          <div className="mt-1 text-xs text-mist">Simulate one scenario across the entire watershed at once</div>
        </Link>
        <Link
          to="/regional/optimize"
          className="flex-1 min-w-[240px] rounded-xl border border-safe/30 bg-safe/10 p-4 transition hover:bg-safe/15"
        >
          <div className="text-sm font-semibold text-safe">💰 Cross-Lake Budget Optimizer</div>
          <div className="mt-1 text-xs text-mist">Allocate a limited budget across all 5 lakes for max impact</div>
        </Link>
        <Link
          to="/cascade"
          className="flex-1 min-w-[240px] rounded-xl border border-high/30 bg-high/10 p-4 transition hover:bg-high/15"
        >
          <div className="text-sm font-semibold text-high">🕸️ Watershed Cascade Network</div>
          <div className="mt-1 text-xs text-mist">Watch stress propagate Osman/Himayat Sagar → Hussain Sagar</div>
        </Link>
        <Link
          to="/timemachine"
          className="flex-1 min-w-[240px] rounded-xl border border-watch/30 bg-watch/10 p-4 transition hover:bg-watch/15"
        >
          <div className="text-sm font-semibold text-watch">⏳ Watershed Time Machine</div>
          <div className="mt-1 text-xs text-mist">Scrub 24 months of real history across the whole map</div>
        </Link>
      </div>

      {loading ? (
        <div className="py-24 text-center text-mist">Loading watershed data…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RiskMap lakes={lakes} />
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <SecurityGauge value={100 - avg("overallRisk")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard label="Avg. Drought Risk" value={avg("droughtRisk")} color="#FFB020" />
              <SummaryCard label="Avg. Pollution Risk" value={avg("pollutionRisk")} color="#FF4D5E" />
              <SummaryCard label="Avg. Ecosystem Stress" value={avg("ecosystemStress")} color="#F2C94C" />
              <SummaryCard label="Avg. Overall Risk" value={avg("overallRisk")} color="#00B8FF" />
            </div>
            <LiveAlertFeed />
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-3 text-lg font-semibold text-white">Water bodies</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lakes.map((lake) => (
                <button
                  key={lake._id}
                  onClick={() => navigate(`/lakes/${lake._id}`)}
                  className="rounded-xl border border-panelBorder bg-panel/60 p-4 text-left transition hover:border-waterblue/50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold text-white">{lake.name}</div>
                    <RiskBadge band={lake.latest.riskBand} size="sm" />
                  </div>
                  <div className="text-xs text-mist">{lake.primaryUse}</div>
                  <div className="mt-3 flex items-center justify-between font-mono text-sm">
                    <span className="text-mist">Overall risk</span>
                    <span className="font-semibold text-waterblue">{lake.latest.overallRisk}/100</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="text-xs text-mist">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold" style={{ color }}>
        {value}%
      </div>
    </div>
  );
}
