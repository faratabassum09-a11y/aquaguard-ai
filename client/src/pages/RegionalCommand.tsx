import { useState } from "react";
import { Link } from "react-router-dom";
import { regionalSimulate } from "../services/api";
import { RegionalSimulateResult } from "../types";
import ScenarioSlider from "../components/ScenarioSlider";
import RiskBadge from "../components/RiskBadge";
import RiskMap from "../components/RiskMap";
import LiveAlertFeed from "../components/LiveAlertFeed";

const DEFAULT_SCENARIO = {
  rainfallChangePct: -25,
  temperatureChangeC: 2,
  extractionChangePct: 15,
  urbanizationChangePct: 10,
  runoffChangePct: 8,
};

export default function RegionalCommand() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [result, setResult] = useState<RegionalSimulateResult | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const data = await regionalSimulate(scenario);
      setResult(data);
    } finally {
      setRunning(false);
    }
  }

  // Build a Lake[]-shaped array for the map so it colors by projected risk once simulated
  const mapLakes = (result?.lakes || []).map((l) => ({
    _id: l.lakeId,
    name: l.name,
    location: l.location,
    latest: { overallRisk: l.projectedRisk, riskBand: l.projectedBand },
  })) as any;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link to="/dashboard" className="text-sm text-waterblue hover:underline">
        ← Command Center
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-bold text-white">🌍 Regional What-If — Entire Watershed</h1>
      <p className="mb-6 text-sm text-mist">
        Apply one climate/urbanization scenario to all 5 Hyderabad water bodies simultaneously and
        watch the whole map react — not just a single lake.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <ScenarioSlider
            label="Rainfall"
            value={scenario.rainfallChangePct}
            min={-50}
            max={30}
            onChange={(v) => setScenario((s) => ({ ...s, rainfallChangePct: v }))}
          />
          <ScenarioSlider
            label="Temperature"
            value={scenario.temperatureChangeC}
            min={-2}
            max={5}
            unit="°C"
            step={0.5}
            onChange={(v) => setScenario((s) => ({ ...s, temperatureChangeC: v }))}
          />
          <ScenarioSlider
            label="Water extraction"
            value={scenario.extractionChangePct}
            min={-20}
            max={40}
            onChange={(v) => setScenario((s) => ({ ...s, extractionChangePct: v }))}
          />
          <ScenarioSlider
            label="Urbanization"
            value={scenario.urbanizationChangePct}
            min={-10}
            max={30}
            onChange={(v) => setScenario((s) => ({ ...s, urbanizationChangePct: v }))}
          />
          <ScenarioSlider
            label="Agricultural / urban runoff"
            value={scenario.runoffChangePct}
            min={-10}
            max={30}
            onChange={(v) => setScenario((s) => ({ ...s, runoffChangePct: v }))}
          />
          <button
            onClick={run}
            disabled={running}
            className="w-full rounded-lg bg-waterblue py-3 font-semibold text-abyss shadow-glow transition hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Simulating watershed…" : "SIMULATE ENTIRE REGION"}
          </button>

          {result && (
            <div className="grid grid-cols-3 gap-2 pt-2 text-center font-mono text-sm">
              <div className="rounded-lg border border-panelBorder p-2">
                <div className="text-mist text-xs">Avg. before</div>
                <div className="text-white">{result.summary.avgBaseline}</div>
              </div>
              <div className="rounded-lg border border-panelBorder p-2">
                <div className="text-mist text-xs">Avg. after</div>
                <div className="text-critical">{result.summary.avgProjected}</div>
              </div>
              <div className="rounded-lg border border-critical/40 bg-critical/10 p-2">
                <div className="text-critical text-xs">New criticals</div>
                <div className="text-critical">{result.summary.newlyCritical}</div>
              </div>
            </div>
          )}

          <LiveAlertFeed />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <RiskMap lakes={result ? mapLakes : []} height="380px" />

          {result && (
            <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
              <div className="mb-3 text-sm text-mist">Per-lake impact of this scenario</div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-panelBorder text-mist">
                    <th className="pb-2 font-normal">Lake</th>
                    <th className="pb-2 font-normal">Before</th>
                    <th className="pb-2 font-normal">After</th>
                    <th className="pb-2 font-normal">Δ</th>
                    <th className="pb-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lakes.map((l) => (
                    <tr key={l.lakeId} className="border-b border-panelBorder/50">
                      <td className="py-2 text-slate-200">
                        <Link to={`/lakes/${l.lakeId}`} className="hover:text-waterblue hover:underline">
                          {l.name}
                        </Link>
                      </td>
                      <td className="py-2 font-mono text-mist">{l.baselineRisk}</td>
                      <td className="py-2 font-mono text-white">{l.projectedRisk}</td>
                      <td className={`py-2 font-mono ${l.delta > 0 ? "text-critical" : "text-safe"}`}>
                        {l.delta > 0 ? "+" : ""}
                        {l.delta}
                      </td>
                      <td className="py-2">
                        <RiskBadge band={l.projectedBand} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
