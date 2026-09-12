import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLake, runSimulation as simulate, getOptimization, getScenarioPresets } from "../services/api";
import { Lake, RiskProfile, OptimizationResult, ScenarioPreset } from "../types";
import ScenarioSlider from "../components/ScenarioSlider";
import RiskBadge from "../components/RiskBadge";
import InterventionPanel from "../components/InterventionPanel";
import CounterfactualImpact from "../components/CounterfactualImpact";

const DEFAULT_SCENARIO = {
  rainfallChangePct: -20,
  temperatureChangeC: 2,
  extractionChangePct: 15,
  urbanizationChangePct: 10,
  runoffChangePct: 8,
};

export default function Simulation() {
  const { id } = useParams<{ id: string }>();
  const [lake, setLake] = useState<Lake | null>(null);
  const [baseline, setBaseline] = useState<RiskProfile | null>(null);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [result, setResult] = useState<any>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [impact, setImpact] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getLake(id).then((data) => {
      setLake(data.lake);
      setBaseline(data.risk);
    });
    getScenarioPresets().then(setPresets);
  }, [id]);

  function applyPreset(preset: ScenarioPreset) {
    setScenario(preset.values);
    setActivePreset(preset.id);
    setResult(null);
    setOptimization(null);
  }

  async function runScenario() {
    if (!id) return;
    setRunning(true);
    setOptimization(null);
    setImpact(null);
    try {
      const data = await simulate({ lakeId: id, ...scenario });
      setResult(data);
    } finally {
      setRunning(false);
    }
  }

  async function optimizeFromResult() {
    if (!id || !result) return;
    const data = await getOptimization(id, result.projected.overallRisk);
    setOptimization(data.optimization);
    setImpact(data.impact);
  }

  if (!lake || !baseline) return <div className="py-24 text-center text-mist">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to={`/lakes/${id}`} className="text-sm text-waterblue hover:underline">
        ← {lake.name}
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-bold text-white">🔮 What-If Simulator</h1>
      <p className="mb-6 text-sm text-mist">
        Drag the sliders to explore future scenarios for {lake.name}, then run the simulation.
      </p>

      {presets.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              title={p.description}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activePreset === p.id
                  ? "border-waterblue bg-waterblue/20 text-waterblue"
                  : "border-panelBorder text-mist hover:border-waterblue/50 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <ScenarioSlider
            label="Rainfall"
            value={scenario.rainfallChangePct}
            min={-50}
            max={30}
            onChange={(v) => {
              setScenario((s) => ({ ...s, rainfallChangePct: v }));
              setActivePreset(null);
            }}
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
            onClick={runScenario}
            disabled={running}
            className="w-full rounded-lg bg-waterblue py-3 font-semibold text-abyss shadow-glow transition hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Simulating…" : "SIMULATE"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-panelBorder bg-panel/60 p-6 text-center">
            <div className="text-sm text-mist">Current risk</div>
            <div className="my-2 flex items-center justify-center gap-4">
              <div>
                <div className="font-mono text-4xl font-bold text-white">{baseline.overallRisk}</div>
                <RiskBadge band={baseline.riskBand} size="sm" />
              </div>
              {result && (
                <>
                  <div className="text-2xl text-mist">→</div>
                  <div>
                    <div
                      className="font-mono text-4xl font-bold"
                      style={{ color: result.projected.overallRisk > baseline.overallRisk ? "#FF4D5E" : "#35D07F" }}
                    >
                      {result.projected.overallRisk}
                    </div>
                    <RiskBadge band={result.projected.riskBand} size="sm" />
                  </div>
                </>
              )}
            </div>
            {!result && <p className="text-xs text-mist">Run a simulation to see the projected risk.</p>}
          </div>

          {result && (
            <>
              <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
                <div className="mb-2 text-sm text-mist">Projected drivers under this scenario</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  <div>Rainfall deficit: <span className="text-waterblue">{result.projectedDrivers.rainfallDeficitPct}%</span></div>
                  <div>Water level: <span className="text-waterblue">{result.projectedDrivers.waterLevelPct}%</span></div>
                  <div>Extraction: <span className="text-waterblue">{result.projectedDrivers.extractionMld} MLD</span></div>
                  <div>Pollution index: <span className="text-waterblue">{result.projectedDrivers.pollutionIndex}</span></div>
                </div>
              </div>

              {!optimization && (
                <button
                  onClick={optimizeFromResult}
                  className="w-full rounded-lg border border-safe/40 bg-safe/10 py-3 font-semibold text-safe hover:bg-safe/20"
                >
                  🧠 OPTIMIZE RESPONSE
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {optimization && (
        <div className="mt-6 space-y-6">
          <InterventionPanel optimization={optimization} />
          {impact && <CounterfactualImpact impact={impact} />}
        </div>
      )}
    </div>
  );
}
