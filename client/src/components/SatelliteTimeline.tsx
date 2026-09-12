import { SatelliteObservation } from "../types";

export default function SatelliteTimeline({
  observations,
  changePct,
}: {
  observations: SatelliteObservation[];
  changePct: number;
}) {
  const max = Math.max(...observations.map((o) => o.waterSurfaceAcres));

  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm text-mist">Satellite change detection — water surface area</div>
        <div className={`font-mono text-lg font-semibold ${changePct < 0 ? "text-critical" : "text-safe"}`}>
          {changePct > 0 ? "+" : ""}
          {changePct}%
        </div>
      </div>
      <p className="mb-4 text-xs text-mist/80">
        Illustrative yearly timeline interpolated between documented historical and current surface
        area figures for this water body — not live satellite image processing (see README).
      </p>
      <div className="flex items-end gap-2 overflow-x-auto pb-2">
        {observations.map((o) => (
          <div key={o.year} className="flex min-w-[64px] flex-col items-center gap-1" title={o.encroachmentNote}>
            <div className="flex h-32 w-full items-end justify-center">
              <div
                className="w-8 rounded-t bg-waterblue transition-all"
                style={{
                  height: `${(o.waterSurfaceAcres / max) * 100}%`,
                  opacity: 0.4 + 0.6 * (o.waterSurfaceAcres / max),
                }}
              />
            </div>
            <div className="font-mono text-[11px] text-mist">{o.year}</div>
            <div className="font-mono text-[10px] text-slate-300">{o.waterSurfaceAcres}ac</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-300">
        {observations[observations.length - 1]?.encroachmentNote}
      </p>
    </div>
  );
}
