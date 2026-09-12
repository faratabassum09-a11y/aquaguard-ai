import { CounterfactualImpact as Impact } from "../types";

function formatNumber(n: number) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`; // lakh
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function CounterfactualImpact({ impact }: { impact: Impact }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-3 text-sm text-mist">Human impact — without action vs. with AQUAGUARD's plan</div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-critical/30 bg-critical/5 p-3">
          <div className="mb-1 text-xs text-critical">WITHOUT ACTION</div>
          <div className="font-mono text-2xl font-bold text-white">{impact.withoutAction.risk}%</div>
          <div className="mt-2 text-xs text-slate-300">
            👥 {formatNumber(impact.withoutAction.populationAffected)} people affected
          </div>
          <div className="text-xs text-slate-300">
            💧 {formatNumber(impact.withoutAction.waterAtRiskMl)} ML/yr at risk
          </div>
        </div>

        <div className="rounded-lg border border-safe/30 bg-safe/5 p-3">
          <div className="mb-1 text-xs text-safe">WITH AQUAGUARD PLAN</div>
          <div className="font-mono text-2xl font-bold text-white">{impact.withPlan.risk}%</div>
          <div className="mt-2 text-xs text-slate-300">
            👥 {formatNumber(impact.withPlan.populationAffected)} people affected
          </div>
          <div className="text-xs text-slate-300">
            💧 {formatNumber(impact.withPlan.waterAtRiskMl)} ML/yr at risk
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-waterblue/10 px-3 py-2 text-center text-sm text-waterblue">
        ✅ Protects ~{formatNumber(impact.populationProtected)} people and{" "}
        {formatNumber(impact.waterProtectedMl)} ML/yr of water
      </div>
    </div>
  );
}
