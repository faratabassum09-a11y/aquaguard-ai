const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("../services/riskService");
const { rankInterventions } = require("../services/optimizationService");
const { estimateCarbonCredit } = require("../services/carbonCreditService");
const { driversFromMeasurement } = require("./lakeController");

async function getCarbonCredit(req, res) {
  try {
    const lakeId = req.params.id;
    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    if (!measurements.length) return res.status(400).json({ error: "No measurements for this lake" });
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);
    const optimization = rankInterventions(risk);

    const carbon = estimateCarbonCredit({ lake, optimization, encroachmentPct: drivers.encroachmentPct });
    res.json({ lake: { id: lake._id, name: lake.name }, carbon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCarbonCredit };
