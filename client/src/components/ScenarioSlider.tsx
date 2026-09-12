export default function ScenarioSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "%",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const sign = value > 0 ? "+" : "";

  return (
    <div className="rounded-lg border border-panelBorder bg-panel/40 p-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="font-mono font-semibold text-waterblue">
          {sign}
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-abyss accent-waterblue"
        style={{
          background: `linear-gradient(to right, #00B8FF ${pct}%, #1B2F47 ${pct}%)`,
        }}
      />
    </div>
  );
}
