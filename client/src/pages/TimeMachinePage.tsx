import { useEffect, useState } from "react";
import { getRegionalTimeMachine } from "../services/api";
import { RegionalTimeMachineResponse } from "../types";
import WatershedTimeMachine from "../components/WatershedTimeMachine";

export default function TimeMachinePage() {
  const [data, setData] = useState<RegionalTimeMachineResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getRegionalTimeMachine()
      .then(setData)
      .catch(() => setError("Could not load watershed history."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-white">⏳ Watershed Time Machine</h1>
      <p className="mt-1 text-sm text-mist">
        Scrub through 24 months of real measurement history and watch AQUAGUARD's risk model evolve, live, using
        only the data that was available at each point in time — no hindsight.
      </p>

      <div className="mt-6">
        {error ? (
          <div className="py-24 text-center text-mist">{error}</div>
        ) : !data ? (
          <div className="py-24 text-center text-mist">Loading 24 months of watershed history…</div>
        ) : (
          <WatershedTimeMachine data={data} />
        )}
      </div>
    </div>
  );
}
