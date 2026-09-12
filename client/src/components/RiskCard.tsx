export default function RiskCard({
  label,
  value,
  suffix = "%",
  accent = "#00B8FF",
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="text-sm text-mist">{label}</div>
      <div className="mt-1 font-mono text-3xl font-semibold" style={{ color: accent }}>
        {value}
        <span className="text-lg text-mist">{suffix}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-abyss">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
