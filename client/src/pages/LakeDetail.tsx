import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLake, getSatellite, getExplanation, getAnomalies } from "../services/api";
import { Lake, RiskProfile, ForecastPoint, SatelliteObservation, Anomaly } from "../types";
import RiskBadge from "../components/RiskBadge";
import RiskCard from "../components/RiskCard";
import ForecastChart from "../components/ForecastChart";
import SatelliteTimeline from "../components/SatelliteTimeline";
import AIAssistant from "../components/AIAssistant";
import SpeakButton from "../components/SpeakButton";
import AnomalyPanel from "../components/AnomalyPanel";
import AlertSubscribeForm from "../components/AlertSubscribeForm";

export default function LakeDetail() {
  const { id } = useParams<{ id: string }>();
  const [lake, setLake] = useState<Lake | null>(null);
  const [risk, setRisk] = useState<RiskProfile | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [satellite, setSatellite] = useState<{ observations: SatelliteObservation[]; changePct: number } | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [explanation, setExplanation] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [tab, setTab] = useState<"forecast" | "satellite">("forecast");

  useEffect(() => {
    if (!id) return;
    getLake(id).then((data) => {
      setLake(data.lake);
      setRisk(data.risk);
      setForecast(data.forecast);
    });
    getSatellite(id).then(setSatellite);
    getAnomalies(id).then((data) => setAnomalies(data.anomalies));
  }, [id]);

  async function loadExplanation() {
    if (!id) return;
    setExplaining(true);
    try {
      const { explanation } = await getExplanation(id);
      setExplanation(explanation);
    } finally {
      setExplaining(false);
    }
  }

  if (!lake || !risk) return <div className="py-24 text-center text-mist">Loading lake intelligence…</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/dashboard" className="text-sm text-waterblue hover:underline">
        ← Command Center
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {lake.name} {lake.localName && <span className="text-mist font-normal">· {lake.localName}</span>}
          </h1>
          <p className="text-sm text-mist">{lake.primaryUse}</p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge band={risk.riskBand} />
          <span className="font-mono text-2xl font-bold text-white">{risk.overallRisk}<span className="text-mist text-base">/100</span></span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/lakes/${id}/simulate`}
            className="rounded-lg border border-waterblue/40 bg-waterblue/10 px-4 py-2 text-sm font-medium text-waterblue hover:bg-waterblue/20"
          >
            🔮 Simulate
          </Link>
          <Link
            to={`/lakes/${id}/action-plan`}
            className="rounded-lg border border-safe/40 bg-safe/10 px-4 py-2 text-sm font-medium text-safe hover:bg-safe/20"
          >
            🧠 Optimize
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RiskCard label="Water Level" value={lake.latest.waterLevelPct} accent="#00B8FF" />
        <RiskCard label="Drought Risk" value={risk.droughtRisk} accent="#FFB020" />
        <RiskCard label="Pollution Risk" value={risk.pollutionRisk} accent="#FF4D5E" />
        <RiskCard label="Ecosystem Stress" value={risk.ecosystemStress} accent="#F2C94C" />
      </div>

      <div className="mb-6 rounded-xl border border-panelBorder bg-panel/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm text-mist">Why is the risk at this level?</div>
          {!explanation && (
            <button
              onClick={loadExplanation}
              disabled={explaining}
              className="rounded-lg bg-waterblue px-3 py-1.5 text-xs font-medium text-abyss hover:opacity-90 disabled:opacity-50"
            >
              {explaining ? "Analyzing…" : "Explain this"}
            </button>
          )}
        </div>

        <div className="mb-3 space-y-1.5">
          {Object.entries(risk.contributions)
            .sort((a, b) => b[1] - a[1])
            .map(([key, value]) => (
              <ContributionBar key={key} label={LABELS[key] || key} value={value} />
            ))}
        </div>

        {explanation && (
          <div className="mt-3 border-t border-panelBorder pt-3">
            <div className="mb-2 flex justify-end">
              <SpeakButton text={explanation} />
            </div>
            <p className="text-sm text-slate-300">{explanation}</p>
          </div>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>
          Forecast
        </TabButton>
        <TabButton active={tab === "satellite"} onClick={() => setTab("satellite")}>
          Satellite History
        </TabButton>
      </div>

      <div className="mb-6">
        {tab === "forecast" && <ForecastChart data={forecast} />}
        {tab === "satellite" && satellite && (
          <SatelliteTimeline observations={satellite.observations} changePct={satellite.changePct} />
        )}
      </div>

      <div className="mb-6 rounded-xl border border-panelBorder bg-panel/60 p-4">
        <div className="mb-2 text-sm text-mist">Documented context</div>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
          {lake.knownIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnomalyPanel anomalies={anomalies} />
        <AlertSubscribeForm lakeId={lake._id} lakeName={lake.name} />
      </div>

      <AIAssistant lakeId={lake._id} />
    </div>
  );
}

const LABELS: Record<string, string> = {
  rainfallDeficit: "Rainfall deficit",
  temperatureAnomaly: "Temperature increase",
  extractionStress: "Water extraction",
  landUseChange: "Land-use change / encroachment",
  pollution: "Pollution & untreated inflow",
};

function ContributionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-56 shrink-0 text-slate-300">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-abyss">
        <div className="h-full rounded-full bg-waterblue" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <div className="w-10 text-right font-mono text-mist">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active ? "bg-waterblue text-abyss" : "border border-panelBorder text-mist hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
