/**
 * Generates 24 months of illustrative monthly measurements per lake,
 * calibrated so each lake's trend matches its real documented situation:
 *  - Durgam Cheruvu & Hussain Sagar trend toward CRITICAL (pollution/encroachment)
 *  - Osman Sagar & Himayat Sagar trend WATCH/HIGH (drought-sensitive reservoirs)
 *  - Shamirpet trends WATCH (urbanization pressure, still recreational-healthy)
 *
 * Hyderabad has a monsoon-driven rainfall pattern (June-Sept wet season),
 * which is reflected in the seasonal rainfall curve below.
 */

const MONSOON_MONTHS = [5, 6, 7, 8]; // Jun-Sep (0-indexed)

// Per-lake calibration profile
const PROFILES = {
  "hussain-sagar": {
    baseRainfall: 90,
    baseTemp: 29,
    baseWaterLevel: 68,
    waterLevelDrift: -0.15,
    baseExtraction: 20,
    extractionDrift: 0.05,
    basePollution: 58,
    pollutionDrift: 0.35,
  },
  "durgam-cheruvu": {
    baseRainfall: 85,
    baseTemp: 29.5,
    baseWaterLevel: 60,
    waterLevelDrift: -0.35,
    baseExtraction: 8,
    extractionDrift: 0.02,
    basePollution: 62,
    pollutionDrift: 0.45,
  },
  "osman-sagar": {
    baseRainfall: 95,
    baseTemp: 28,
    baseWaterLevel: 74,
    waterLevelDrift: -0.2,
    baseExtraction: 95,
    extractionDrift: 0.15,
    basePollution: 22,
    pollutionDrift: 0.1,
  },
  "himayat-sagar": {
    baseRainfall: 92,
    baseTemp: 28,
    baseWaterLevel: 71,
    waterLevelDrift: -0.22,
    baseExtraction: 88,
    extractionDrift: 0.14,
    basePollution: 24,
    pollutionDrift: 0.1,
  },
  "shamirpet-lake": {
    baseRainfall: 88,
    baseTemp: 28.5,
    baseWaterLevel: 66,
    waterLevelDrift: -0.18,
    baseExtraction: 6,
    extractionDrift: 0.04,
    basePollution: 34,
    pollutionDrift: 0.2,
  },
};

// Deliberately injected "recent event" anomalies for the demo - each represents
// a realistic incident (a sewage overflow, a sudden blockage) so the anomaly
// detector has genuine signal to catch rather than only smooth trends. Only 2
// of 5 lakes carry an injected event, so the contrast in the demo is clear.
const INJECTED_EVENTS = {
  "hussain-sagar": { metric: "pollutionIndex", monthsAgo: 0, type: "multiply", factor: 1.55 },
  "durgam-cheruvu": { metric: "waterLevelPct", monthsAgo: 0, type: "add", delta: -16 },
};

function applyInjectedEvent(measurements, slug) {
  const event = INJECTED_EVENTS[slug];
  if (!event) return measurements;

  const idx = measurements.length - 1 - event.monthsAgo;
  if (idx < 0) return measurements;

  const point = measurements[idx];
  if (event.type === "multiply") {
    point[event.metric] = Math.min(100, Math.round(point[event.metric] * event.factor));
  } else if (event.type === "add") {
    point[event.metric] = Math.max(5, Math.min(100, Math.round(point[event.metric] + event.delta)));
  }
  return measurements;
}

function generateMeasurements(slug, months = 24) {
  const profile = PROFILES[slug];
  if (!profile) throw new Error(`No measurement profile for lake slug: ${slug}`);

  const measurements = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIdx = date.getMonth();
    const isMonsoon = MONSOON_MONTHS.includes(monthIdx);
    const monthsAgo = i;
    const progress = months - i; // 1..months, increases as we approach "now"

    const seasonalRainfall = isMonsoon
      ? profile.baseRainfall * 2.4
      : profile.baseRainfall * 0.35;
    const rainfallNoise = (Math.sin(progress * 1.7) + 1) * 8;
    const rainfallMm = Math.max(5, Math.round(seasonalRainfall + rainfallNoise - progress * 0.4));

    const seasonalTemp = isMonsoon ? -1.5 : monthIdx >= 2 && monthIdx <= 4 ? 4 : 0;
    const temperatureC = Number((profile.baseTemp + seasonalTemp + progress * 0.04).toFixed(1));

    const waterLevelPct = Math.max(
      15,
      Math.min(
        100,
        Math.round(
          profile.baseWaterLevel +
            profile.waterLevelDrift * progress +
            (isMonsoon ? 10 : -3) +
            Math.sin(progress) * 2
        )
      )
    );

    const extractionMld = Math.round(
      profile.baseExtraction * (1 + (profile.extractionDrift * progress) / 100)
    );

    const pollutionIndex = Math.max(
      5,
      Math.min(
        100,
        Math.round(
          profile.basePollution +
            profile.pollutionDrift * progress +
            (isMonsoon ? -4 : 3) // monsoon flushes some pollutants, dry season concentrates them
        )
      )
    );

    measurements.push({
      date,
      rainfallMm,
      temperatureC,
      waterLevelPct,
      extractionMld,
      pollutionIndex,
    });
  }

  return applyInjectedEvent(measurements, slug);
}

module.exports = { generateMeasurements };
