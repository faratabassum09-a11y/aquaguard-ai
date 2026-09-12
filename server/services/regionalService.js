/**
 * regionalService.js
 *
 * Shared watershed-wide computation logic, extracted from regionalController
 * so that BOTH the /api/regional REST endpoints AND the new agentic AI
 * assistant (agentService.js) run the exact same simulation/optimization
 * code path — no drift between "what the map shows" and "what the
 * assistant says it ran".
 */

const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("./riskService");
const { runSimulation } = require("./simulationService");
const { rankInterventions } = require("./optimizationService");
const { driversFromMeasurement } = require("../controllers/lakeController");

const COST_TO_RUPEES = { Low: 500000, Medium: 2000000, High: 8000000 }; // illustrative order-of-magnitude costs (INR)

/**
 * Runs one what-if scenario across every lake simultaneously.
 */
async function computeRegionalScenario(scenario) {
  const lakes = await Lake.find();
  const results = [];

  for (const lake of lakes) {
    const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
    if (!measurements.length) continue;
    const latest = measurements[measurements.length - 1];
    const baseline = driversFromMeasurement(lake, latest, measurements);
    const baselineRisk = computeRisk(baseline);
    const result = runSimulation(baseline, scenario);

    results.push({
      lakeId: lake._id,
      name: lake.name,
      slug: lake.slug,
      location: lake.location,
      baselineRisk: baselineRisk.overallRisk,
      baselineBand: baselineRisk.riskBand,
      projectedRisk: result.projected.overallRisk,
      projectedBand: result.projected.riskBand,
      delta: result.projected.overallRisk - baselineRisk.overallRisk,
    });
  }

  const avgBaseline = results.length
    ? Math.round(results.reduce((s, r) => s + r.baselineRisk, 0) / results.length)
    : 0;
  const avgProjected = results.length
    ? Math.round(results.reduce((s, r) => s + r.projectedRisk, 0) / results.length)
    : 0;
  const newlyCriticalLakes = results.filter(
    (r) => r.baselineBand !== "CRITICAL" && r.projectedBand === "CRITICAL"
  );

  return {
    scenario,
    lakes: results.sort((a, b) => b.projectedRisk - a.projectedRisk),
    summary: { avgBaseline, avgProjected, newlyCritical: newlyCriticalLakes.length },
    newlyCriticalLakes,
  };
}

/**
 * Cross-lake budget optimizer (see original comment in regionalController
 * history: greedy-by-efficiency approximation of a one-item-per-lake
 * knapsack, sorted by risk-reduction-per-rupee).
 */
async function computeRegionalOptimize(budgetInr) {
  const lakes = await Lake.find();
  const items = [];

  for (const lake of lakes) {
    const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
    if (!measurements.length) continue;
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);
    const optimization = rankInterventions(risk);

    for (const intervention of optimization.ranked) {
      items.push({
        lakeId: String(lake._id),
        lakeName: lake.name,
        strategy: intervention.strategy,
        description: intervention.description,
        costInr: COST_TO_RUPEES[intervention.cost],
        costLabel: intervention.cost,
        riskReductionPct: intervention.riskReductionPct,
        currentRisk: risk.overallRisk,
      });
    }
  }

  const byEfficiency = [...items].sort(
    (a, b) => b.riskReductionPct / b.costInr - a.riskReductionPct / a.costInr
  );

  const fundedLakeIds = new Set();
  const funded = [];
  let remainingBudget = budgetInr;

  for (const item of byEfficiency) {
    if (fundedLakeIds.has(item.lakeId)) continue;
    if (item.costInr <= remainingBudget) {
      funded.push(item);
      fundedLakeIds.add(item.lakeId);
      remainingBudget -= item.costInr;
    }
  }

  const totalRiskReduction = funded.reduce((s, f) => s + f.riskReductionPct, 0);
  const totalSpent = budgetInr - remainingBudget;
  const unfunded = lakes.filter((l) => !fundedLakeIds.has(String(l._id))).map((l) => l.name);

  return {
    budgetInr,
    totalSpent,
    remainingBudget,
    funded: funded.sort((a, b) => b.riskReductionPct - a.riskReductionPct),
    unfundedLakes: unfunded,
    totalRiskReductionPts: totalRiskReduction,
    lakesFundedCount: funded.length,
    lakesTotalCount: lakes.length,
  };
}

module.exports = { computeRegionalScenario, computeRegionalOptimize, COST_TO_RUPEES };
