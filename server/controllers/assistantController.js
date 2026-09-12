const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRisk } = require("../services/riskService");
const { forecastWaterLevel } = require("../services/forecastService");
const { rankInterventions } = require("../services/optimizationService");
const { answerQuestion } = require("../services/aiService");
const { driversFromMeasurement } = require("./lakeController");
const { runAgent } = require("../services/agentService");

async function ask(req, res) {
  try {
    const { lakeId, question } = req.body;
    if (!question) return res.status(400).json({ error: "question is required" });

    const lake = await Lake.findById(lakeId);
    if (!lake) return res.status(404).json({ error: "Lake not found" });

    const measurements = await Measurement.find({ lakeId }).sort({ date: 1 });
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);
    const forecast = forecastWaterLevel(measurements);
    const optimization = rankInterventions(risk);

    // Agentic layer: try to actually EXECUTE the question as a live
    // simulation/optimization run (see services/agentService.js) instead of
    // only narrating pre-loaded context. Failures here are non-fatal — the
    // assistant just falls back to a normal contextual answer.
    let toolExecution = null;
    try {
      toolExecution = await runAgent({ lake, question, baselineDrivers: drivers, baselineRisk: risk });
    } catch (agentErr) {
      console.error("[assistantController] agent execution failed:", agentErr.message);
    }

    const answer = await answerQuestion(lake, risk, optimization, forecast, question, toolExecution);
    res.json({ answer, toolExecution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { ask };
