/**
 * timeMachineService.js
 *
 * "Watershed Time Machine" — reconstructs how AQUAGUARD's own risk model
 * would have scored a lake at EVERY point across its measurement history,
 * using only the data that would have been available up to that month (a
 * trailing average, exactly like the live dashboard's baseline computation
 * in lakeController/liveAlerts) — not a re-interpretation with hindsight.
 *
 * Encroachment/vegetation loss (from documented historical vs. current
 * surface area) is assumed to progress roughly monotonically across the
 * window toward the documented current figure, since satellite-observed
 * land-use change is a slow trend, not a single-month event — this mirrors
 * generateSatellite.js's own non-linear "accelerating in recent years"
 * interpolation, kept here as a straight-line approximation for
 * transparency (see README - "decision-support estimate" framing).
 */

const { computeRisk } = require("./riskService");

function buildTimeline(lake, measurements) {
  if (!measurements || !measurements.length) return [];

  const historicalAcres = lake.area?.historicalAcres || lake.area?.currentAcres || 1;
  const currentAcres = lake.area?.currentAcres || historicalAcres;
  const finalEncroachmentPct = Math.max(0, ((historicalAcres - currentAcres) / historicalAcres) * 100);

  return measurements.map((m, idx) => {
    const windowSoFar = measurements.slice(0, idx + 1);
    const avgRainfall = windowSoFar.reduce((s, x) => s + x.rainfallMm, 0) / windowSoFar.length;
    const avgTemp = windowSoFar.reduce((s, x) => s + x.temperatureC, 0) / windowSoFar.length;

    const progress = (idx + 1) / measurements.length;
    const encroachmentPct = finalEncroachmentPct * progress;

    const drivers = {
      rainfallDeficitPct: Math.max(0, ((avgRainfall - m.rainfallMm) / avgRainfall) * 100),
      temperatureAnomalyC: Math.max(0, m.temperatureC - avgTemp),
      waterLevelPct: m.waterLevelPct,
      extractionMld: m.extractionMld,
      extractionCapacityMld: lake.type === "drinking_water_reservoir" ? 120 : 60,
      pollutionIndex: m.pollutionIndex,
      encroachmentPct,
      vegetationLossPct: encroachmentPct * 0.6,
    };

    const risk = computeRisk(drivers);

    return {
      date: m.date,
      monthIndex: idx,
      waterLevelPct: m.waterLevelPct,
      pollutionIndex: m.pollutionIndex,
      rainfallMm: m.rainfallMm,
      temperatureC: m.temperatureC,
      extractionMld: m.extractionMld,
      encroachmentPct: Math.round(encroachmentPct * 10) / 10,
      overallRisk: risk.overallRisk,
      riskBand: risk.riskBand,
      droughtRisk: risk.droughtRisk,
      pollutionRisk: risk.pollutionRisk,
      ecosystemStress: risk.ecosystemStress,
    };
  });
}

module.exports = { buildTimeline };
