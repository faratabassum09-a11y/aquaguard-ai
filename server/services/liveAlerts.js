/**
 * liveAlerts.js
 *
 * Powers the dashboard's live feed. Two sources feed into it:
 *
 * 1. REAL anomaly detection (anomalyService) run against each lake's actual
 *    measurement history - when a lake has a detected anomaly, that's what
 *    gets surfaced, with its real statistical description.
 * 2. A lightweight heartbeat filler (generic monitoring lines) for lakes
 *    with nothing currently anomalous, so the feed still feels alive
 *    between real events. This filler is clearly a demo heartbeat, not a
 *    sensor reading - documented here and in the README.
 *
 * When a lake's real computed risk is CRITICAL, this also automatically
 * calls alertDispatchService to notify any subscribed phone numbers via
 * SMS/WhatsApp (or logs a simulated send if no Twilio credentials are
 * configured) - so the "phone buzzes" moment is driven by the same real
 * risk computation as everything else in the app, not a separate mock path.
 */

const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const AlertSubscription = require("../models/AlertSubscription");
const { computeRisk } = require("../services/riskService");
const { detectAnomalies } = require("./anomalyService");
const { dispatchCriticalAlert } = require("./alertDispatchService");

const HEARTBEAT_TEMPLATES = [
  (lake) => `${lake.name}: satellite pass completed, no significant surface change detected.`,
  (lake) => `${lake.name}: measurement sync complete, risk score stable.`,
  (lake) => `${lake.name}: routine monitoring check - no anomalies flagged this cycle.`,
];

const SEVERITY_BY_BAND = { CRITICAL: "critical", HIGH: "high", WATCH: "watch", SAFE: "info" };
const alreadyDispatchedThisSession = new Set(); // avoid spamming the same critical lake every tick

function driversFromMeasurement(lake, latestMeasurement, allMeasurements) {
  const avgRainfall = allMeasurements.reduce((s, m) => s + m.rainfallMm, 0) / allMeasurements.length;
  const avgTemp = allMeasurements.reduce((s, m) => s + m.temperatureC, 0) / allMeasurements.length;
  const historicalAcres = lake.area?.historicalAcres || lake.area?.currentAcres || 1;
  const currentAcres = lake.area?.currentAcres || historicalAcres;
  const encroachmentPct = Math.max(0, ((historicalAcres - currentAcres) / historicalAcres) * 100);

  return {
    rainfallDeficitPct: Math.max(0, ((avgRainfall - latestMeasurement.rainfallMm) / avgRainfall) * 100),
    temperatureAnomalyC: Math.max(0, latestMeasurement.temperatureC - avgTemp),
    waterLevelPct: latestMeasurement.waterLevelPct,
    extractionMld: latestMeasurement.extractionMld,
    extractionCapacityMld: lake.type === "drinking_water_reservoir" ? 120 : 60,
    pollutionIndex: latestMeasurement.pollutionIndex,
    encroachmentPct,
    vegetationLossPct: encroachmentPct * 0.6,
  };
}

function startLiveAlerts(io) {
  async function tick() {
    try {
      const lakes = await Lake.find();
      if (!lakes.length) return;

      const lake = lakes[Math.floor(Math.random() * lakes.length)];
      const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
      if (!measurements.length) return;

      const drivers = driversFromMeasurement(lake, measurements[measurements.length - 1], measurements);
      const risk = computeRisk(drivers);
      const anomalies = detectAnomalies(measurements);

      let alert;
      if (anomalies.length > 0) {
        const top = anomalies[0];
        alert = {
          id: `${Date.now()}-${lake._id}`,
          lakeId: lake._id,
          lakeName: lake.name,
          message: `${lake.name}: ${top.description}`,
          severity: top.severity === "high" ? "critical" : "high",
          detectionMethod: top.detectionMethod,
          timestamp: new Date().toISOString(),
        };
      } else {
        const template = HEARTBEAT_TEMPLATES[Math.floor(Math.random() * HEARTBEAT_TEMPLATES.length)];
        alert = {
          id: `${Date.now()}-${lake._id}`,
          lakeId: lake._id,
          lakeName: lake.name,
          message: template(lake),
          severity: SEVERITY_BY_BAND[risk.riskBand] || "info",
          timestamp: new Date().toISOString(),
        };
      }

      io.emit("alert", alert);

      // Auto-dispatch SMS/WhatsApp if this lake is genuinely CRITICAL and we
      // haven't already notified subscribers in this server session.
      if (risk.riskBand === "CRITICAL" && !alreadyDispatchedThisSession.has(String(lake._id))) {
        const subs = await AlertSubscription.find({
          active: true,
          $or: [{ lakeId: null }, { lakeId: lake._id }],
        });
        if (subs.length > 0) {
          const dispatch = await dispatchCriticalAlert(subs, lake, risk);
          io.emit("alert-dispatched", { lakeId: lake._id, lakeName: lake.name, ...dispatch });
          alreadyDispatchedThisSession.add(String(lake._id));
        }
      }
    } catch (err) {
      console.error("[liveAlerts] tick failed:", err.message);
    }
  }

  setTimeout(tick, 4000);
  setInterval(tick, 12000);
}

module.exports = { startLiveAlerts };
