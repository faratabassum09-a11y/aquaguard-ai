const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("../services/riskService");
const { rankInterventions } = require("../services/optimizationService");
const { counterfactualImpact } = require("../services/impactService");
const { driversFromMeasurement } = require("./lakeController");

async function optimize(req, res) {
  try {
    const { lakeId } = req.params;
    const { projectedRisk } = req.query; // optional: optimize against a simulated risk instead of current

    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    if (!measurements.length) return res.status(400).json({ error: "No measurements for this lake" });

    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    let risk = computeRisk(drivers);

    if (projectedRisk) {
      risk = { ...risk, overallRisk: Number(projectedRisk) };
    }

    const optimization = rankInterventions(risk);
    const impact = counterfactualImpact({
      withoutActionRisk: optimization.withoutAction,
      withPlanRisk: optimization.recommended.projectedRisk,
      dependentPopulation: lake.population?.dependentPopulationEstimate || 0,
      extractionMld: latest.extractionMld,
    });

    res.json({ lake: { id: lake._id, name: lake.name }, risk, optimization, impact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { optimize };

