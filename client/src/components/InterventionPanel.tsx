import { OptimizationResult } from "../types";

const costColor: Record<string, string> = { Low: "text-safe", Medium: "text-watch", High: "text-critical" };
const feasColor: Record<string, string> = { High: "text-safe", Medium: "text-watch", Low: "text-critical" };

export default function InterventionPanel({ optimization }: { optimization: OptimizationResult }) {
  const rec = optimization.recommended;

  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-3 text-sm text-mist">AI recommendation — ranked interventions</div>

      <div className="mb-4 rounded-lg border border-waterblue/30 bg-waterblue/10 p-4">
        <div className="mb-1 text-xs uppercase tracking-wide text-waterblue">🥇 Recommended strategy</div>
        <div className="text-lg font-semibold text-white">{rec.strategy}</div>
        <p className="mt-1 text-sm text-slate-300">{rec.description}</p>
        <div className="mt-3 flex items-center gap-6 font-mono text-sm">
          <div>
            Without action: <span className="font-semibold text-critical">{optimization.withoutAction}%</span>
          </div>
          <div>→</div>
          <div>
            With plan: <span className="font-semibold text-safe">{rec.projectedRisk}%</span>
          </div>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-panelBorder text-mist">
            <th className="pb-2 font-normal">Strategy</th>
            <th className="pb-2 font-normal">Risk ↓</th>
            <th className="pb-2 font-normal">Cost</th>
            <th className="pb-2 font-normal">Feasibility</th>
            <th className="pb-2 font-normal">Score</th>
          </tr>
        </thead>
        <tbody>
          {optimization.ranked.map((i, idx) => (
            <tr key={i.strategy} className={`border-b border-panelBorder/50 ${idx === 0 ? "bg-waterblue/5" : ""}`}>
              <td className="py-2 pr-2 text-slate-200">{i.strategy}</td>
              <td className="py-2 font-mono text-safe">-{i.riskReductionPct}pt</td>
              <td className={`py-2 font-mono ${costColor[i.cost]}`}>{i.cost}</td>
              <td className={`py-2 font-mono ${feasColor[i.feasibility]}`}>{i.feasibility}</td>
              <td className="py-2 font-mono text-slate-300">{i.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
