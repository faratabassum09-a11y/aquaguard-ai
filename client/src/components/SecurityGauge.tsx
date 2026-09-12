export default function SecurityGauge({ value, label = "Water Security Index" }: { value: number; label?: string }) {
  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // half circle
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 70 ? "#35D07F" : pct >= 50 ? "#F2C94C" : pct >= 30 ? "#FFB020" : "#FF4D5E";

  return (
    <div className="flex flex-col items-center rounded-xl border border-panelBorder bg-panel/60 p-4">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="#1B2F47"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="font-mono" fontSize="28" fontWeight="700" fill={color}>
          {pct}
        </text>
      </svg>
      <div className="-mt-2 text-center text-xs text-mist">{label}</div>
    </div>
  );
}
