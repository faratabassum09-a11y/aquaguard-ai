/**
 * optimizationService.js
 *
 * Ranks candidate interventions for a lake given its current risk profile.
 * For the hackathon MVP this uses a transparent scoring formula:
 *
 *   score = (riskReductionPct * 0.6) + (feasibilityScore * 0.25) - (costScore * 0.15)
 *
 * Feasibility/cost are mapped Low/Medium/High -> numeric weights.
 * Swap this for a trained multi-criteria optimization model post-hackathon.
 */

const LEVEL_SCORE = { Low: 3, Medium: 2, High: 1 }; // for cost: Low cost = best (3)
const FEASIBILITY_SCORE = { High: 3, Medium: 2, Low: 1 };

// Candidate intervention templates. riskReductionPct is the estimated
// percentage-point reduction in overall risk if applied, calibrated per
// lake "type" (drinking water reservoir vs urban lake) further down.
const BASE_INTERVENTIONS = [
  {
    strategy: "Reduce water extraction",
    description: "Enforce extraction limits and promote alternate supply sources to relieve pressure on the reservoir.",
    cost: "Medium",
    feasibility: "High",
    baseReduction: 14,
  },
  {
    strategy: "Agricultural & urban runoff control",
    description: "Install silt/nutrient traps and enforce buffer zones to cut nutrient and sewage runoff into the lake.",
    cost: "Low",
    feasibility: "High",
    baseReduction: 11,
  },
  {
    strategy: "Restore catchment vegetation",
    description: "Re-vegetate the catchment and shoreline to reduce runoff velocity and improve groundwater recharge.",
    cost: "Low",
    feasibility: "High",
    baseReduction: 9,
  },
  {
    strategy: "Sewage interception & treatment",
    description: "Intercept untreated sewage inflow points and route to STPs before they reach the lake.",
    cost: "High",
    feasibility: "Medium",
    baseReduction: 18,
  },
  {
    strategy: "Anti-encroachment enforcement",
    description: "Demarcate the Full Tank Level boundary and remove unauthorized structures encroaching the lake bed.",
    cost: "Medium",
    feasibility: "Medium",
    baseReduction: 13,
  },
  {
    strategy: "Real-time monitoring network",
    description: "Deploy IoT water-level/quality sensors for continuous monitoring and early-warning alerts.",
    cost: "Medium",
    feasibility: "High",
    baseReduction: 6,
  },
  {
    strategy: "Combined conservation strategy",
    description: "A bundled plan: extraction limits + runoff control + vegetation restoration, executed together.",
    cost: "Medium",
    feasibility: "Medium",
    baseReduction: 26,
  },
];

function rankInterventions(riskProfile) {
  const { overallRisk, pollutionRisk, droughtRisk, ecosystemStress } = riskProfile;

  const interventions = BASE_INTERVENTIONS.map((base) => {
    // Nudge each intervention's effectiveness based on which sub-risk dominates
    let adjustedReduction = base.baseReduction;
    if (base.strategy.includes("extraction") && droughtRisk > 60) adjustedReduction += 4;
    if (base.strategy.includes("runoff") && pollutionRisk > 60) adjustedReduction += 4;
    if (base.strategy.includes("vegetation") && ecosystemStress > 60) adjustedReduction += 3;
    if (base.strategy.includes("Sewage") && pollutionRisk > 65) adjustedReduction += 5;
    if (base.strategy.includes("encroachment") && ecosystemStress > 65) adjustedReduction += 4;
    if (base.strategy.includes("Combined")) {
      adjustedReduction = Math.round(
        (overallRisk - Math.max(15, overallRisk * 0.45))
      );
    }

    const riskReductionPct = Math.max(3, Math.min(adjustedReduction, overallRisk - 5));
    const projectedRisk = Math.max(5, overallRisk - riskReductionPct);

    const score =
      riskReductionPct * 0.6 +
      FEASIBILITY_SCORE[base.feasibility] * 8.33 * 0.25 -
      (3 - LEVEL_SCORE[base.cost]) * 8.33 * 0.15;

    return {
      strategy: base.strategy,
      description: base.description,
      cost: base.cost,
      feasibility: base.feasibility,
      riskReductionPct,
      projectedRisk,
      score: Number(score.toFixed(1)),
    };
  }).sort((a, b) => b.score - a.score);

  return {
    withoutAction: overallRisk,
    ranked: interventions,
    recommended: interventions[0],
  };
}

module.exports = { rankInterventions };
