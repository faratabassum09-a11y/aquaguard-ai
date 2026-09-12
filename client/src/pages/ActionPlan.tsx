import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import jsPDF from "jspdf";
import { getActionPlan, getCarbonCredit } from "../services/api";
import { RiskProfile, OptimizationResult, CounterfactualImpact as ImpactType, CarbonCreditEstimate } from "../types";
import InterventionPanel from "../components/InterventionPanel";
import RiskBadge from "../components/RiskBadge";
import CounterfactualImpact from "../components/CounterfactualImpact";
import SpeakButton from "../components/SpeakButton";
import CarbonCreditCard from "../components/CarbonCreditCard";

export default function ActionPlan() {
  const { id } = useParams<{ id: string }>();
  const [lakeName, setLakeName] = useState("");
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [impact, setImpact] = useState<ImpactType | null>(null);
  const [carbon, setCarbon] = useState<CarbonCreditEstimate | null>(null);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getActionPlan(id)
      .then((data) => {
        setLakeName(data.lake.name);
        setRisk(data.risk);
        setOptimization(data.optimization);
        setImpact(data.impact);
        setPlan(data.plan);
      })
      .finally(() => setLoading(false));
    getCarbonCredit(id).then((data) => setCarbon(data.carbon));
  }, [id]);

  function exportPdf() {
    const doc = new jsPDF();
    const marginX = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.text(`AQUAGUARD AI — Action Plan`, marginX, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`${lakeName}`, marginX, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Risk: ${risk?.overallRisk}/100 (${risk?.riskBand})`, marginX, y);
    y += 10;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(plan, 180);
    doc.text(lines, marginX, y);
    y += lines.length * 5 + 8;

    if (optimization) {
      doc.setFontSize(13);
      doc.text("Ranked interventions", marginX, y);
      y += 7;
      doc.setFontSize(9);
      optimization.ranked.slice(0, 5).forEach((iv) => {
        const row = `${iv.strategy} — risk reduction -${iv.riskReductionPct}pt, cost ${iv.cost}, feasibility ${iv.feasibility}`;
        const rowLines = doc.splitTextToSize(row, 180);
        doc.text(rowLines, marginX, y);
        y += rowLines.length * 5 + 2;
      });
    }

    if (impact) {
      y += 5;
      doc.setFontSize(13);
      doc.text("Human impact", marginX, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(
        `Without action: ${impact.withoutAction.populationAffected.toLocaleString()} people affected, ${impact.withoutAction.waterAtRiskMl.toLocaleString()} ML/yr at risk`,
        marginX,
        y
      );
      y += 6;
      doc.text(
        `With plan: ${impact.withPlan.populationAffected.toLocaleString()} people affected, ${impact.withPlan.waterAtRiskMl.toLocaleString()} ML/yr at risk`,
        marginX,
        y
      );
    }

    doc.save(`${lakeName.replace(/\s+/g, "_")}_AQUAGUARD_Action_Plan.pdf`);
  }

  if (loading) return <div className="py-24 text-center text-mist">Generating action plan…</div>;
  if (!risk || !optimization) return <div className="py-24 text-center text-mist">Could not load plan.</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to={`/lakes/${id}`} className="text-sm text-waterblue hover:underline">
        ← {lakeName}
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📋 30-Day Water Crisis Prevention Plan</h1>
        <RiskBadge band={risk.riskBand} />
      </div>

      <div className="mb-6 rounded-xl border border-panelBorder bg-panel/60 p-6">
        <div className="mb-3 flex justify-end">
          <SpeakButton text={plan} />
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">{plan}</pre>
      </div>

      {impact && (
        <div className="mb-6">
          <CounterfactualImpact impact={impact} />
        </div>
      )}

      {carbon && (
        <div className="mb-6">
          <CarbonCreditCard carbon={carbon} />
        </div>
      )}

      <InterventionPanel optimization={optimization} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={exportPdf}
          className="w-full rounded-lg bg-waterblue py-3 text-sm font-semibold text-abyss hover:opacity-90"
        >
          ⬇ Download PDF Report
        </button>
        <button
          onClick={() => window.print()}
          className="w-full rounded-lg border border-panelBorder py-3 text-sm font-medium text-mist hover:text-white"
        >
          🖨 Print
        </button>
      </div>
    </div>
  );
}
