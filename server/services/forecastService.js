/**
 * forecastService.js
 *
 * Simple linear-trend forecast with a widening confidence band, computed
 * from the last N measurements. This is intentionally lightweight for the
 * hackathon MVP (see README) — swap in an XGBoost/Prophet-style model
 * trained on the `measurements` collection post-hackathon.
 */

function forecastWaterLevel(measurements, daysAhead = 30, stepDays = 5) {
  if (!measurements.length) return [];

  const n = measurements.length;
  const xs = measurements.map((_, i) => i);
  const ys = measurements.map((m) => m.waterLevelPct);

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0) /
    (xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0) || 1);
  const intercept = meanY - slope * meanX;

  const lastIndex = n - 1;
  const points = [];
  for (let d = 0; d <= daysAhead; d += stepDays) {
    // approximate "days" as fractional measurement steps (measurements are monthly)
    const stepIndex = lastIndex + d / 30;
    const predicted = intercept + slope * stepIndex;
    const confidence = Math.min(25, 3 + d * 0.6); // widening uncertainty band
    points.push({
      dayOffset: d,
      predictedWaterLevelPct: Math.max(0, Math.min(100, Math.round(predicted))),
      lowerBound: Math.max(0, Math.round(predicted - confidence)),
      upperBound: Math.min(100, Math.round(predicted + confidence)),
    });
  }
  return points;
}

module.exports = { forecastWaterLevel };
