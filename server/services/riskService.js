/**
 * riskService.js
 *
 * AQUAGUARD's risk model is intentionally transparent for the hackathon MVP:
 * a calibrated weighted-contribution model rather than a black-box score.
 * Every output includes a breakdown showing exactly why the number is what it is,
 * which is the core "Explain" layer of the product.
 *
 * This is documented as a decision-support estimate, not a scientifically
 * validated hydrological model (see README - "Scientific honesty" section).
 */

const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/**
 * Compute sub-risk scores (0-100) and an overall risk score from a set of
 * normalized environmental drivers. `drivers` values are already expressed
 * as "deviation from safe baseline" percentages, e.g. rainfallDeficitPct.
 */
function computeRisk({
  rainfallDeficitPct = 0, // % below historical average rainfall
  temperatureAnomalyC = 0, // degrees above historical average
  waterLevelPct = 70, // current % of full tank level
  extractionMld = 0, // current extraction, million litres/day
  extractionCapacityMld = 100, // sustainable extraction capacity for this lake
  pollutionIndex = 30, // 0-100 raw pollution proxy (BOD/COD/coliform composite)
  encroachmentPct = 0, // % of historical surface area lost to encroachment
  vegetationLossPct = 0, // % loss in catchment vegetation cover
}) {
  // --- Drought risk: driven by rainfall deficit, temperature anomaly, and water level ---
  const droughtRisk = clamp(
    rainfallDeficitPct * 0.9 +
      temperatureAnomalyC * 6 +
      (100 - waterLevelPct) * 0.5
  );

  // --- Pollution risk: driven by raw pollution index plus extraction stress ---
  const extractionStressPct = clamp(((extractionMld - extractionCapacityMld) / extractionCapacityMld) * 100, 0, 100);
  const pollutionRisk = clamp(pollutionIndex * 0.8 + extractionStressPct * 0.2);

  // --- Ecosystem stress: driven by encroachment + vegetation loss + pollution ---
  const ecosystemStress = clamp(
    encroachmentPct * 1.1 + vegetationLossPct * 0.6 + pollutionIndex * 0.25
  );

  // --- Weighted contribution breakdown for overall risk (sums to overall score) ---
  // Weights are calibrated so that land-use change (encroachment) and pollution -
  // the two factors most documented in Hyderabad's own lake reports - dominate
  // the score, with rainfall/temperature/extraction as secondary amplifiers.
  const contributions = {
    rainfallDeficit: rainfallDeficitPct * 0.38,
    temperatureAnomaly: temperatureAnomalyC * 5.5,
    extractionStress: extractionStressPct * 0.3,
    landUseChange: encroachmentPct * 1.3,
    pollution: pollutionIndex * 0.55,
  };

  const overallRisk = clamp(
    Object.values(contributions).reduce((a, b) => a + b, 0)
  );

  let riskBand = "SAFE";
  if (overallRisk > 70) riskBand = "CRITICAL";
  else if (overallRisk > 50) riskBand = "HIGH";
  else if (overallRisk > 30) riskBand = "WATCH";

  return {
    droughtRisk: Math.round(droughtRisk),
    pollutionRisk: Math.round(pollutionRisk),
    ecosystemStress: Math.round(ecosystemStress),
    overallRisk: Math.round(overallRisk),
    riskBand,
    contributions: Object.fromEntries(
      Object.entries(contributions).map(([k, v]) => [k, Math.round(clamp(v, 0, 100))])
    ),
  };
}

module.exports = { computeRisk, clamp };
