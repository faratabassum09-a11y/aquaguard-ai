import { useState } from "react";
import { CascadeEdge, CascadeNode } from "../types";
import { riskColor } from "./RiskBadge";

// Stylized flow-diagram layout (not geographic) - deliberately arranged so
// the real Osman Sagar / Himayat Sagar -> Musi chain -> Hussain Sagar
// connection reads left-to-right as "upstream -> downstream", with the two
// hydrologically-independent lakes (Durgam Cheruvu, Shamirpet) off to the
// side, clearly NOT wired into the chain.
const POSITIONS: Record<string, { x: number; y: number }> = {
  "osman-sagar": { x: 140, y: 70 },
  "himayat-sagar": { x: 140, y: 230 },
  "hussain-sagar": { x: 430, y: 150 },
  "durgam-cheruvu": { x: 680, y: 70 },
  "shamirpet-lake": { x: 680, y: 230 },
};

export default function CascadeNetwork({ nodes, edges }: { nodes: CascadeNode[]; edges: CascadeEdge[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const bySlug = Object.fromEntries(nodes.map((n) => [n.slug, n]));
  const connectedSlugs = new Set(edges.flatMap((e) => [e.from, e.to]));

  const selectedNode = selected ? bySlug[selected] : null;

  return (
    <div className="rounded-xl border border-panelBorder bg-panel/60 p-4">
      <div className="mb-1 text-sm text-mist">
        Watershed Cascade Network — real Osman Sagar / Himayat Sagar → Musi river chain → Hussain Sagar
        connectivity
      </div>
      <p className="mb-4 text-xs text-mist/80">
        Illustrative watershed-connectivity model grounded in real, documented geography — not surveyed/gauged
        hydrology. Stress that a scenario adds to an upstream reservoir propagates downstream along these
        edges, on top of that lake's own local simulation.
      </p>

      <svg viewBox="0 0 820 320" className="w-full" style={{ minHeight: 280 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#00B8FF" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const from = POSITIONS[edge.from];
          const to = POSITIONS[edge.to];
          const toNode = bySlug[edge.to];
          const stressed = toNode && toNode.cascadeAdjustment > 0;
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              <line
                x1={from.x + 46}
                y1={from.y}
                x2={to.x - 46}
                y2={to.y}
                stroke={stressed ? "#FF4D5E" : "#00B8FF"}
                strokeWidth={stressed ? 3 : 2}
                strokeDasharray="6 5"
                markerEnd="url(#arrow)"
                opacity={0.75}
              >
                {stressed && (
                  <animate attributeName="stroke-dashoffset" from="40" to="0" dur="1.2s" repeatCount="indefinite" />
                )}
              </line>
              <text x={midX} y={(from.y + to.y) / 2 - 10} textAnchor="middle" fontSize="10" fill="#8CA3BF">
                {edge.label}
                {stressed ? ` (+${bySlug[edge.to].cascadeAdjustment})` : ""}
              </text>
            </g>
          );
        })}

        {nodes.map((n) => {
          const pos = POSITIONS[n.slug];
          if (!pos) return null;
          const color = riskColor(n.cascadeBand);
          const isSelected = selected === n.slug;
          const isolated = !connectedSlugs.has(n.slug);
          return (
            <g
              key={n.slug}
              transform={`translate(${pos.x}, ${pos.y})`}
              className="cursor-pointer"
              onClick={() => setSelected(n.slug)}
            >
              <circle
                r={isSelected ? 46 : 42}
                fill={color}
                fillOpacity={0.18}
                stroke={color}
                strokeWidth={isSelected ? 3 : 2}
              />
              <circle r={6} fill={color} />
              <text y={62} textAnchor="middle" fontSize="12" fontWeight={600} fill="#E8EEF7">
                {n.name}
              </text>
              <text y={78} textAnchor="middle" fontSize="11" fontFamily="monospace" fill={color}>
                {n.cascadeProjectedRisk}/100
              </text>
              {isolated && (
                <text y={-56} textAnchor="middle" fontSize="9" fill="#8CA3BF">
                  independent catchment
                </text>
              )}
              {n.cascadeAdjustment > 0 && (
                <text y={-56} textAnchor="middle" fontSize="9" fill="#FF4D5E">
                  +{n.cascadeAdjustment} cascade stress
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {selectedNode && (
        <div className="mt-3 rounded-lg border border-panelBorder bg-abyss/60 p-3 text-xs text-slate-300">
          <div className="mb-1 font-semibold text-white">{selectedNode.name}</div>
          <div>
            Local simulation: {selectedNode.baselineRisk} → {selectedNode.projectedRisk}/100 (
            {selectedNode.projectedBand})
          </div>
          {selectedNode.cascadeAdjustment > 0 ? (
            <div className="mt-1 text-critical">
              + {selectedNode.cascadeAdjustment} pts propagated downstream stress → final{" "}
              {selectedNode.cascadeProjectedRisk}/100 ({selectedNode.cascadeBand})
              <ul className="ml-4 mt-1 list-disc text-mist">
                {selectedNode.incomingFrom.map((inc, i) => (
                  <li key={i}>
                    {inc.addedStress} pts from {inc.fromName} via {inc.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-1 text-mist">No incoming cascade stress from upstream lakes in this scenario.</div>
          )}
        </div>
      )}
    </div>
  );
}
