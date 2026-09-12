import { useEffect, useState } from "react";
import { runCascade, getScenarioPresets } from "../services/api";
import { CascadeResponse, ScenarioPreset } from "../types";
import CascadeNetwork from "../components/CascadeNetwork";
import ScenarioSlider from "../components/ScenarioSlider";

const DEFAULT_SCENARIO = {
  rainfallChangePct: -30,
  temperatureChangeC: 1.5,
  extractionChangePct: 10,
  urbanizationChangePct: 2,
  runoffChangePct: 4,
};

export default function CascadeNetworkPage() {
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [result, setResult] = useState<CascadeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getScenarioPresets().then((d) => setPresets(d.presets || d));
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      runCascade(scenario)
        .then(setResult)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [scenario]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-white">🕸️ Watershed Cascade Network</h1>
      <p className="mt-1 text-sm text-mist">
        Hyderabad's reservoirs aren't independent dots on a map — Osman Sagar and Himayat Sagar are the real,
        documented twin headwater reservoirs of the Musi river, which historically flows through the city core
        past Hussain Sagar. Stress a scenario adds upstream propagates downstream here.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
            <div className="mb-3 text-sm font-semibold text-white">Scenario</div>
            {presets.length > 0 && (
              <select
                className="mb-3 w-full rounded-lg border border-panelBorder bg-abyss px-3 py-2 text-sm text-slate-100"
                onChange={(e) => {
                  const p = presets.find((x) => x.id === e.target.value);
                  if (p) setScenario(p.values);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Load a preset…
                </option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
            <div className="space-y-3">
              <ScenarioSlider
                label="Rainfall change"
                value={scenario.rainfallChangePct}
                min={-60}
                max={40}
                onChange={(v) => setScenario((s) => ({ ...s, rainfallChangePct: v }))}
              />
              <ScenarioSlider
                label="Temperature change"
                value={scenario.temperatureChangeC}
                min={-2}
                max={5}
                step={0.5}
                unit="°C"
                onChange={(v) => setScenario((s) => ({ ...s, temperatureChangeC: v }))}
              />
              <ScenarioSlider
                label="Extraction change"
                value={scenario.extractionChangePct}
                min={-30}
                max={60}
                onChange={(v) => setScenario((s) => ({ ...s, extractionChangePct: v }))}
              />
              <ScenarioSlider
                label="Urbanization change"
                value={scenario.urbanizationChangePct}
                min={0}
                max={50}
                onChange={(v) => setScenario((s) => ({ ...s, urbanizationChangePct: v }))}
              />
              <ScenarioSlider
                label="Runoff / pollution change"
                value={scenario.runoffChangePct}
                min={0}
                max={40}
                onChange={(v) => setScenario((s) => ({ ...s, runoffChangePct: v }))}
              />
            </div>
          </div>

          {result && (
            <div className="rounded-xl border border-panelBorder bg-panel/60 p-4 text-xs text-mist">
              <div className="mb-1 font-mono text-sm text-waterblue">
                Avg risk: {result.summary.avgBaseline} → {result.summary.avgProjected}
              </div>
              <div>{result.summary.newlyCritical} lake(s) newly CRITICAL under this scenario.</div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {loading && !result ? (
            <div className="py-24 text-center text-mist">Running cascade…</div>
          ) : result ? (
            <CascadeNetwork nodes={result.nodes} edges={result.edges} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
