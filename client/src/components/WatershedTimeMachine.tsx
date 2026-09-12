import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from "recharts";
import { RegionalTimeMachineResponse } from "../types";
import { riskColor } from "./RiskBadge";

const LAKE_COLORS = ["#00B8FF", "#35D07F", "#FFB020", "#FF4D5E", "#A78BFA"];

export default function WatershedTimeMachine({ data }: { data: RegionalTimeMachineResponse }) {
  const [month, setMonth] = useState(data.months - 1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setMonth((m) => (m + 1 >= data.months ? 0 : m + 1));
      }, 450);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [playing, data.months]);

  const snapshot = data.lakes.map((l) => ({
    lakeId: l.lakeId,
    name: l.name,
    location: l.location,
    point: l.timeline[Math.min(month, l.timeline.length - 1)],
  }));

  const currentDateLabel = snapshot[0]
    ? new Date(snapshot[0].point.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  const chartData = useMemo(() => {
    const rows: any[] = [];
    for (let i = 0; i < data.months; i++) {
      const row: any = {
        month: new Date(data.lakes[0]?.timeline[i]?.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      };
      data.lakes.forEach((l) => {
        row[l.name] = l.timeline[i]?.overallRisk;
      });
      rows.push(row);
    }
    return rows;
  }, [data]);

  const avgRisk = Math.round(snapshot.reduce((s, x) => s + (x.point?.overallRisk || 0), 0) / (snapshot.length || 1));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-mist">Scrubbing watershed history</div>
            <div className="font-mono text-lg font-semibold text-waterblue">{currentDateLabel}</div>
          </div>
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-mist">Watershed avg risk</span>
            <span className="text-xl font-semibold" style={{ color: riskColor(avgRisk > 70 ? "CRITICAL" : avgRisk > 50 ? "HIGH" : avgRisk > 30 ? "WATCH" : "SAFE") }}>
              {avgRisk}/100
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-waterblue text-abyss"
          >
            {playing ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, data.months - 1)}
            value={month}
            onChange={(e) => {
              setPlaying(false);
              setMonth(Number(e.target.value));
            }}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-abyss accent-waterblue"
          />
          <span className="w-20 shrink-0 text-right font-mono text-xs text-mist">
            month {month + 1}/{data.months}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div style={{ height: 420 }} className="overflow-hidden rounded-xl border border-panelBorder lg:col-span-2">
          <MapContainer center={[17.42, 78.42]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            />
            {snapshot.map((s) => (
              <CircleMarker
                key={s.lakeId}
                center={[s.location.lat, s.location.lng]}
                radius={12 + (s.point?.overallRisk || 0) / 8}
                pathOptions={{
                  color: riskColor(s.point?.riskBand || "SAFE"),
                  fillColor: riskColor(s.point?.riskBand || "SAFE"),
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="font-medium">{s.name}</div>
                  <div>
                    Risk: {s.point?.overallRisk}/100 · {s.point?.riskBand}
                  </div>
                  <div>Water level: {s.point?.waterLevelPct}%</div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
          <div className="mb-2 text-xs text-mist">Overall risk over 24 months</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2F47" />
              <XAxis dataKey="month" stroke="#8CA3BF" fontSize={9} interval={2} />
              <YAxis stroke="#8CA3BF" fontSize={10} domain={[0, 100]} />
              <ChartTooltip contentStyle={{ background: "#0D1B2E", border: "1px solid #1B2F47", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {data.lakes.map((l, idx) => (
                <Line
                  key={l.lakeId}
                  type="monotone"
                  dataKey={l.name}
                  stroke={LAKE_COLORS[idx % LAKE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
