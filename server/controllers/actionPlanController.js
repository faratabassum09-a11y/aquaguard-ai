const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("../services/riskService");
const { rankInterventions } = require("../services/optimizationService");
const { generateActionPlan } = require("../services/aiService");
const { counterfactualImpact } = require("../services/impactService");
const { driversFromMeasurement } = require("./lakeController");

async function getActionPlan(req, res) {
  try {
    const lakeId = req.params.id;
    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);
    const optimization = rankInterventions(risk);
    const impact = counterfactualImpact({
      withoutActionRisk: optimization.withoutAction,
      withPlanRisk: optimization.recommended.projectedRisk,
      dependentPopulation: lake.population?.dependentPopulationEstimate || 0,
      extractionMld: latest.extractionMld,
    });

    const plan = await generateActionPlan(lake, risk, optimization);
    res.json({ lake: { id: lake._id, name: lake.name }, risk, optimization, impact, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getActionPlan };
