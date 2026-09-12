/**
 * anomalyService.js
 *
 * Real statistical anomaly detection over each lake's actual measurement
 * history — this is what lets AQUAGUARD say "we noticed this" instead of
 * only answering "what happens if". No LLM involved: every anomaly is
 * derived from a transparent statistical test so it can be justified line
 * by line, the same "explainable over black-box" principle as riskService.
 *
 * Method: for each tracked metric, compute the rolling mean/stddev over
 * the trailing window (excluding the most recent point), then a z-score
 * for the latest point. |z| beyond the threshold is flagged. A separate
 * rate-of-change check catches sudden jumps that a slow-moving mean might
 * not flag yet (e.g. a pollution spike in the most recent month).
 */

const METRICS = [
  { key: "pollutionIndex", label: "Pollution index", direction: "high", unit: "" },
  { key: "waterLevelPct", label: "Water level", direction: "low", unit: "%" },
  { key: "extractionMld", label: "Extraction volume", direction: "high", unit: " MLD" },
  { key: "rainfallMm", label: "Rainfall", direction: "low", unit: "mm" },
];

const Z_THRESHOLD = 1.6; // flags roughly the top ~5-10% of deviations - tuned for a 24-point monthly series
const JUMP_THRESHOLD_PCT = 22; // month-over-month % change considered a sudden jump
const MIN_PCT_DEVIATION = 8; // guards against a statistically "significant" but practically trivial deviation
                              // (a near-deterministic trend can have tiny variance, inflating z-scores for
                              // a 2% wobble) - require the deviation to also be practically meaningful

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stddev(arr, m) {
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * @param {Array} measurements - sorted ascending by date, at least 6 points
 * @returns {Array} anomalies, most severe first
 */
function detectAnomalies(measurements) {
  if (!measurements || measurements.length < 6) return [];

  const anomalies = [];
  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];
  const window = measurements.slice(0, -1); // history excluding latest point

  for (const metric of METRICS) {
    const historyValues = window.map((m) => m[metric.key]);
    const m = mean(historyValues);
    const sd = stddev(historyValues, m) || 0.0001;
    const latestVal = latest[metric.key];
    const z = (latestVal - m) / sd;

    const flaggedByZ =
      ((metric.direction === "high" && z > Z_THRESHOLD) ||
        (metric.direction === "low" && z < -Z_THRESHOLD)) &&
      Math.abs(((latestVal - m) / m) * 100) >= MIN_PCT_DEVIATION;

    const momChangePct = previous[metric.key] !== 0 ? ((latestVal - previous[metric.key]) / previous[metric.key]) * 100 : 0;
    const flaggedByJump =
      (metric.direction === "high" && momChangePct > JUMP_THRESHOLD_PCT) ||
      (metric.direction === "low" && momChangePct < -JUMP_THRESHOLD_PCT);

    if (flaggedByZ || flaggedByJump) {
      const severity = Math.abs(z) > Z_THRESHOLD * 1.6 || Math.abs(momChangePct) > JUMP_THRESHOLD_PCT * 1.6 ? "high" : "medium";
      anomalies.push({
        metric: metric.key,
        label: metric.label,
        latestValue: Math.round(latestVal * 10) / 10,
        historicalAverage: Math.round(m * 10) / 10,
        zScore: Number(z.toFixed(2)),
        monthOverMonthChangePct: Math.round(momChangePct),
        severity,
        detectionMethod: flaggedByZ && flaggedByJump ? "z-score + month-over-month jump" : flaggedByZ ? "z-score deviation" : "month-over-month jump",
        description: buildDescription(metric, latestVal, m, momChangePct, metric.unit),
      });
    }
  }

  return anomalies.sort((a, b) => (b.severity === "high" ? 1 : 0) - (a.severity === "high" ? 1 : 0) || Math.abs(b.zScore) - Math.abs(a.zScore));
}

function buildDescription(metric, latestVal, avg, momChangePct, unit) {
  const dir = latestVal > avg ? "above" : "below";
  const changeDir = momChangePct > 0 ? "up" : "down";
  const roundedMomChange = Math.abs(Math.round(momChangePct));
  return `${metric.label} is ${Math.abs(Math.round(((latestVal - avg) / avg) * 100))}% ${dir} its trailing average` +
    ` (${latestVal}${unit} vs. ${Math.round(avg * 10) / 10}${unit} avg), ${changeDir} ${roundedMomChange}% month-over-month.`;
}

module.exports = { detectAnomalies, METRICS, Z_THRESHOLD, JUMP_THRESHOLD_PCT };
