import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { ForecastPoint } from "../types";

export default function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const chartData = data.map((d) => ({
    day: d.dayOffset === 0 ? "Now" : `+${d.dayOffset}d`,
    predicted: d.predictedWaterLevelPct,
    lower: d.lowerBound,
    bandWidth: Math.max(0, d.upperBound - d.lowerBound),
  }));

  return (
    <div className="h-72 w-full rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-2 text-sm text-mist">Water level forecast (30 days) — with confidence band</div>
      <ResponsiveContainer width="100%" height="88%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B2F47" />
          <XAxis dataKey="day" stroke="#8CA3BF" fontSize={12} />
          <YAxis stroke="#8CA3BF" fontSize={12} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "#0D1B2E", border: "1px solid #1B2F47", borderRadius: 8 }}
            labelStyle={{ color: "#E2E8F0" }}
          />
          <Area type="monotone" dataKey="upper" stroke="none" fill="#00B8FF" fillOpacity={0.08} />
          <Area type="monotone" dataKey="lower" stroke="none" fill="#07111F" fillOpacity={1} />
          <Line type="monotone" dataKey="predicted" stroke="#00B8FF" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
