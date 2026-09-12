const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const SatelliteObservation = require("../models/SatelliteObservation");
const { computeRisk } = require("../services/riskService");
const { forecastWaterLevel } = require("../services/forecastService");
const { rankInterventions } = require("../services/optimizationService");
const { explainRisk } = require("../services/aiService");
const { detectAnomalies } = require("../services/anomalyService");
const { buildTimeline } = require("../services/timeMachineService");

// Convert a lake's latest measurement into the "driver" shape riskService expects
function driversFromMeasurement(lake, latestMeasurement, allMeasurements) {
  const avgRainfall =
    allMeasurements.reduce((s, m) => s + m.rainfallMm, 0) / allMeasurements.length;
  const avgTemp =
    allMeasurements.reduce((s, m) => s + m.temperatureC, 0) / allMeasurements.length;

  const rainfallDeficitPct = Math.max(
    0,
    ((avgRainfall - latestMeasurement.rainfallMm) / avgRainfall) * 100
  );
  const temperatureAnomalyC = Math.max(0, latestMeasurement.temperatureC - avgTemp);

  const historicalAcres = lake.area?.historicalAcres || lake.area?.currentAcres || 1;
  const currentAcres = lake.area?.currentAcres || historicalAcres;
  const encroachmentPct = Math.max(
    0,
    ((historicalAcres - currentAcres) / historicalAcres) * 100
  );

  return {
    rainfallDeficitPct,
    temperatureAnomalyC,
    waterLevelPct: latestMeasurement.waterLevelPct,
    extractionMld: latestMeasurement.extractionMld,
    extractionCapacityMld: lake.type === "drinking_water_reservoir" ? 120 : 60,
    pollutionIndex: latestMeasurement.pollutionIndex,
    encroachmentPct,
    vegetationLossPct: encroachmentPct * 0.6,
  };
}

async function getAllLakes(req, res) {
  try {
    const lakes = await Lake.find().sort({ "latest.overallRisk": -1 });
    res.json(lakes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getLakeById(req, res) {
  try {
    const lake = await Lake.findById(req.params.id);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
    if (!measurements.length) return res.json({ lake, risk: null, forecast: [] });

    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);
    const forecast = forecastWaterLevel(measurements);

    res.json({ lake, latestMeasurement: latest, drivers, risk, forecast });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMeasurements(req, res) {
  try {
    const measurements = await Measurement.find({ lakeId: req.params.id }).sort({ date: 1 });
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getSatelliteHistory(req, res) {
  try {
    const observations = await SatelliteObservation.find({ lakeId: req.params.id }).sort({
      year: 1,
    });
    if (!observations.length) return res.json({ observations: [], changePct: 0 });

    const first = observations[0].waterSurfaceAcres;
    const last = observations[observations.length - 1].waterSurfaceAcres;
    const changePct = Math.round(((last - first) / first) * 100);

    res.json({ observations, changePct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getExplanation(req, res) {
  try {
    const lake = await Lake.findById(req.params.id);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);

    const explanation = await explainRisk(lake, risk);
    res.json({ risk, explanation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAnomalies(req, res) {
  try {
    const measurements = await Measurement.find({ lakeId: req.params.id }).sort({ date: 1 });
    const anomalies = detectAnomalies(measurements);
    res.json({ anomalies, checkedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTimeMachine(req, res) {
  try {
    const lake = await Lake.findById(req.params.id);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
    const timeline = buildTimeline(lake, measurements);

    res.json({ lakeId: lake._id, name: lake.name, slug: lake.slug, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllLakes,
  getLakeById,
  getMeasurements,
  getSatelliteHistory,
  getExplanation,
  getAnomalies,
  getTimeMachine,
  driversFromMeasurement,
};
