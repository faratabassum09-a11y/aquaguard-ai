/**
 * impactService.js
 *
 * Translates abstract risk-percentage numbers into human, judge-legible
 * impact estimates: how many people are affected, how much water is at
 * stake. This is a calibrated estimate (see README) driven by each lake's
 * documented dependent-population figure, not a demographic model.
 */

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

/**
 * @param {number} riskPct - overall risk score 0-100
 * @param {number} dependentPopulation - people who rely on/around this water body
 * @param {number} extractionMld - current daily extraction, million litres/day
 */
function estimateImpact(riskPct, dependentPopulation, extractionMld) {
  // Population meaningfully "affected" scales with risk severity above the
  // WATCH threshold (30) - below that, impact is considered negligible.
  const severity = clamp((riskPct - 30) / 70); // 0 at risk<=30, 1 at risk=100
  const populationAffected = Math.round(dependentPopulation * severity);

  // Annualized water-at-risk: current daily extraction * 365 * severity,
  // expressed in million litres (ML).
  const waterAtRiskMl = Math.round(extractionMld * 365 * severity);

  return { populationAffected, waterAtRiskMl, severity: Math.round(severity * 100) };
}

/**
 * Produces a "without action" vs "with recommended plan" comparison.
 */
function counterfactualImpact({ withoutActionRisk, withPlanRisk, dependentPopulation, extractionMld }) {
  const without = estimateImpact(withoutActionRisk, dependentPopulation, extractionMld);
  const withPlan = estimateImpact(withPlanRisk, dependentPopulation, extractionMld);

  return {
    withoutAction: { risk: withoutActionRisk, ...without },
    withPlan: { risk: withPlanRisk, ...withPlan },
    populationProtected: Math.max(0, without.populationAffected - withPlan.populationAffected),
    waterProtectedMl: Math.max(0, without.waterAtRiskMl - withPlan.waterAtRiskMl),
  };
}

module.exports = { estimateImpact, counterfactualImpact };
