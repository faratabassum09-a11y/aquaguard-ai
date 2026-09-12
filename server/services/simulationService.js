/**
 * simulationService.js
 *
 * A calibrated "scenario-based decision-support simulation" (not a full
 * physical hydrological digital twin - see README). It models the
 * well-established directional relationships:
 *
 *   rainfall down       -> inflow down       -> water level down -> stress up
 *   temperature up       -> evaporation up    -> availability down -> stress up
 *   extraction up         -> water level down -> stress up
 *   urbanization up       -> runoff/encroachment up -> ecosystem stress up
 *   agricultural runoff up -> pollution up -> pollution risk up
 */

const { computeRisk, clamp } = require("./riskService");

function runSimulation(baseline, scenario) {
  const {
    rainfallChangePct = 0, // e.g. -20 means 20% less rainfall
    temperatureChangeC = 0, // e.g. +2 means 2C hotter
    extractionChangePct = 0, // e.g. +15 means 15% more extraction
    urbanizationChangePct = 0, // e.g. +10 means 10% more built-up catchment
    runoffChangePct = 0, // e.g. +8 means 8% more agricultural/urban runoff
  } = scenario;

  // Translate scenario sliders into the driver inputs riskService expects
  const rainfallDeficitPct = clamp(
    baseline.rainfallDeficitPct + Math.max(0, -rainfallChangePct) * 1.0
  );
  const temperatureAnomalyC = Math.max(0, baseline.temperatureAnomalyC + temperatureChangeC);
  const waterLevelPct = clamp(
    baseline.waterLevelPct -
      Math.max(0, -rainfallChangePct) * 0.35 -
      Math.max(0, temperatureChangeC) * 3 -
      Math.max(0, extractionChangePct) * 0.4,
    5,
    100
  );
  const extractionMld = baseline.extractionMld * (1 + extractionChangePct / 100);
  const pollutionIndex = clamp(
    baseline.pollutionIndex + runoffChangePct * 0.6 + urbanizationChangePct * 0.3
  );
  const encroachmentPct = clamp(baseline.encroachmentPct + urbanizationChangePct * 0.5);
  const vegetationLossPct = clamp(baseline.vegetationLossPct + urbanizationChangePct * 0.4);

  const projected = computeRisk({
    rainfallDeficitPct,
    temperatureAnomalyC,
    waterLevelPct,
    extractionMld,
    extractionCapacityMld: baseline.extractionCapacityMld,
    pollutionIndex,
    encroachmentPct,
    vegetationLossPct,
  });

  return {
    scenario,
    projectedDrivers: {
      rainfallDeficitPct: Math.round(rainfallDeficitPct),
      temperatureAnomalyC: Number(temperatureAnomalyC.toFixed(1)),
      waterLevelPct: Math.round(waterLevelPct),
      extractionMld: Math.round(extractionMld),
      pollutionIndex: Math.round(pollutionIndex),
      encroachmentPct: Math.round(encroachmentPct),
    },
    projected,
  };
}

module.exports = { runSimulation };
