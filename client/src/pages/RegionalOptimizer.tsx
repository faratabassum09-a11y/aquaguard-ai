import { useState } from "react";
import { Link } from "react-router-dom";
import { regionalOptimize } from "../services/api";
import { RegionalOptimizeResult } from "../types";

const PRESET_BUDGETS = [2000000, 5000000, 10000000, 20000000];

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function RegionalOptimizer() {
  const [budget, setBudget] = useState(5000000);
  const [result, setResult] = useState<RegionalOptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(b: number) {
    setBudget(b);
    setLoading(true);
    try {
      const data = await regionalOptimize(b);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link to="/dashboard" className="text-sm text-waterblue hover:underline">
        ← Command Center
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-bold text-white">💰 Cross-Lake Budget Optimizer</h1>
      <p className="mb-6 text-sm text-mist">
        Most systems optimize one site. AQUAGUARD allocates a limited government budget across the{" "}
        <span className="text-slate-200">entire watershed</span> to maximize total risk reduction —
        a discrete cross-lake allocation problem solved with an efficiency-ranked knapsack approach.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-mist">Available budget:</span>
        {PRESET_BUDGETS.map((b) => (
          <button
            key={b}
            onClick={() => run(b)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              budget === b && result
                ? "border-waterblue bg-waterblue/20 text-waterblue"
                : "border-panelBorder text-mist hover:border-waterblue/50"
            }`}
          >
            {formatInr(b)}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 text-center text-mist">Allocating budget across the watershed…</div>}

      {result && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total spent" value={formatInr(result.totalSpent)} />
            <StatCard label="Lakes funded" value={`${result.lakesFundedCount} / ${result.lakesTotalCount}`} />
            <StatCard
              label="Total risk reduction"
              value={`-${result.totalRiskReductionPts} pts`}
              accent="#35D07F"
            />
          </div>

          <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
            <div className="mb-3 text-sm text-mist">Funded interventions (ranked by efficiency)</div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panelBorder text-mist">
                  <th className="pb-2 font-normal">Lake</th>
                  <th className="pb-2 font-normal">Strategy</th>
                  <th className="pb-2 font-normal">Cost</th>
                  <th className="pb-2 font-normal">Risk ↓</th>
                </tr>
              </thead>
              <tbody>
                {result.funded.map((f) => (
                  <tr key={f.lakeId} className="border-b border-panelBorder/50">
                    <td className="py-2 text-slate-200">
                      <Link to={`/lakes/${f.lakeId}`} className="hover:text-waterblue hover:underline">
                        {f.lakeName}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-300">{f.strategy}</td>
                    <td className="py-2 font-mono text-waterblue">{formatInr(f.costInr)}</td>
                    <td className="py-2 font-mono text-safe">-{f.riskReductionPct}pt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.unfundedLakes.length > 0 && (
            <div className="rounded-xl border border-high/30 bg-high/10 p-4 text-sm text-high">
              ⚠️ Budget insufficient to fund: {result.unfundedLakes.join(", ")}. Increase the budget to
              cover the full watershed.
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="py-16 text-center text-sm text-mist">Choose a budget above to see the optimal allocation.</div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = "#00B8FF" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4 text-center">
      <div className="text-xs text-mist">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
