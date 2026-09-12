const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const Simulation = require("../models/Simulation");
const { computeRisk } = require("../services/riskService");
const { runSimulation } = require("../services/simulationService");
const { estimateImpact } = require("../services/impactService");
const { driversFromMeasurement } = require("./lakeController");

async function simulate(req, res) {
  try {
    const { lakeId, rainfallChangePct, temperatureChangeC, extractionChangePct, urbanizationChangePct, runoffChangePct } =
      req.body;

    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    if (!measurements.length) return res.status(400).json({ error: "No measurements for this lake" });

    const latest = measurements[measurements.length - 1];
    const baseline = driversFromMeasurement(lake, latest, measurements);
    const baselineRisk = computeRisk(baseline);

    const scenario = {
      rainfallChangePct: Number(rainfallChangePct) || 0,
      temperatureChangeC: Number(temperatureChangeC) || 0,
      extractionChangePct: Number(extractionChangePct) || 0,
      urbanizationChangePct: Number(urbanizationChangePct) || 0,
      runoffChangePct: Number(runoffChangePct) || 0,
    };

    const result = runSimulation(baseline, scenario);

    const impact = {
      current: estimateImpact(
        baselineRisk.overallRisk,
        lake.population?.dependentPopulationEstimate || 0,
        latest.extractionMld
      ),
      projected: estimateImpact(
        result.projected.overallRisk,
        lake.population?.dependentPopulationEstimate || 0,
        result.projectedDrivers.extractionMld
      ),
    };

    const saved = await Simulation.create({
      lakeId,
      inputs: scenario,
      baselineRisk: baselineRisk.overallRisk,
      projectedRisk: result.projected.overallRisk,
      breakdown: result.projected.contributions,
    });

    res.json({
      lake: { id: lake._id, name: lake.name },
      baseline: baselineRisk,
      scenario,
      projectedDrivers: result.projectedDrivers,
      projected: result.projected,
      impact,
      simulationId: saved._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { simulate };
