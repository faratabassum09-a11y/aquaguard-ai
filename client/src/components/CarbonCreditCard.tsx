import { CarbonCreditEstimate } from "../types";

function formatInr(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function CarbonCreditCard({ carbon }: { carbon: CarbonCreditEstimate }) {
  return (
    <div className="rounded-xl border border-safe/30 bg-safe/5 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-safe">
        🌱 Climate finance potential
      </div>
      <p className="mb-3 text-xs text-mist">
        Restoring this lake's lost vegetation could also unlock carbon-credit financing.
      </p>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-abyss/40 p-2">
          <div className="font-mono text-lg font-bold text-white">{carbon.restorableAcres}</div>
          <div className="text-[10px] text-mist">acres restorable</div>
        </div>
        <div className="rounded-lg bg-abyss/40 p-2">
          <div className="font-mono text-lg font-bold text-safe">{carbon.annualCO2Tonnes}</div>
          <div className="text-[10px] text-mist">tCO2e / year</div>
        </div>
        <div className="rounded-lg bg-abyss/40 p-2">
          <div className="font-mono text-lg font-bold text-waterblue">{formatInr(carbon.annualValueInr)}</div>
          <div className="text-[10px] text-mist">est. value / year</div>
        </div>
      </div>

      <div className="rounded-lg bg-waterblue/10 px-3 py-2 text-center text-sm font-semibold text-waterblue">
        ~{formatInr(carbon.tenYearValueInr)} in potential climate financing over 10 years
      </div>

      <p className="mt-3 text-[10px] italic text-mist">{carbon.assumptions.note}</p>
    </div>
  );
}
