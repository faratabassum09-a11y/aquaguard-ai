/**
 * cascadeService.js
 *
 * "Watershed Cascade Network" — models the real, documented hydrological
 * connection between Hyderabad's reservoirs: Osman Sagar and Himayat Sagar
 * are the twin headwater reservoirs built on the Musi river specifically to
 * supply and protect the city; Hussain Sagar sits downstream in that same
 * historic Musi drainage chain through the city core. Durgam Cheruvu and
 * Shamirpet Lake sit in separate local catchments with no direct
 * surface-water link to the Musi chain, so they are modeled as independent
 * nodes — we only connect what is real and documented.
 *
 * This is an illustrative watershed-connectivity model for decision-support
 * demo purposes (a directional relationship grounded in real geography, not
 * a surveyed/gauged hydrological network) — the same "explainable, honestly
 * labeled estimate" philosophy used throughout AQUAGUARD (see README).
 *
 * Mechanism: when a scenario pushes an upstream reservoir's risk up, some
 * fraction of that *increase* propagates downstream as additional stress
 * (e.g. a stressed Osman/Himayat Sagar means less regulated, more erratic
 * Musi-chain flow reaching Hussain Sagar, worsening its own drought/dilution
 * dynamics) — on top of whatever Hussain Sagar's own local simulation
 * already computed.
 */

const EDGES = [
  {
    from: "osman-sagar",
    to: "hussain-sagar",
    label: "Musi river chain",
    weight: 0.22,
    description: "Osman Sagar regulates Musi river flow reaching the city core; reservoir stress reduces downstream flow reliability.",
  },
  {
    from: "himayat-sagar",
    to: "hussain-sagar",
    label: "Musi river chain",
    weight: 0.18,
    description: "Himayat Sagar is the twin Musi headwater reservoir; compounding stress with Osman Sagar amplifies downstream impact.",
  },
];

function bandFor(risk) {
  if (risk > 70) return "CRITICAL";
  if (risk > 50) return "HIGH";
  if (risk > 30) return "WATCH";
  return "SAFE";
}

/**
 * @param {Object} lakesBySlug - { slug: { name, baselineRisk, projectedRisk, ... } }
 * @returns {Object} same keys, each augmented with cascadeAdjustment / cascadeProjectedRisk / cascadeBand / incomingFrom
 */
function propagateStress(lakesBySlug) {
  const propagated = {};
  for (const slug of Object.keys(lakesBySlug)) {
    propagated[slug] = { ...lakesBySlug[slug], cascadeAdjustment: 0, incomingFrom: [] };
  }

  for (const edge of EDGES) {
    const upstream = lakesBySlug[edge.from];
    const downstream = lakesBySlug[edge.to];
    if (!upstream || !downstream) continue;

    const upstreamRiskIncrease = Math.max(0, upstream.projectedRisk - upstream.baselineRisk);
    const addedStress = Math.round(upstreamRiskIncrease * edge.weight);

    if (addedStress > 0) {
      propagated[edge.to].cascadeAdjustment += addedStress;
      propagated[edge.to].incomingFrom.push({
        from: edge.from,
        fromName: upstream.name,
        label: edge.label,
        addedStress,
      });
    }
  }

  for (const slug of Object.keys(propagated)) {
    const node = propagated[slug];
    const cascadeProjectedRisk = Math.max(0, Math.min(100, node.projectedRisk + node.cascadeAdjustment));
    node.cascadeProjectedRisk = cascadeProjectedRisk;
    node.cascadeBand = bandFor(cascadeProjectedRisk);
  }

  return propagated;
}

function getEdges() {
  return EDGES;
}

module.exports = { propagateStress, getEdges };
