/**
 * Generates a yearly satellite-observation timeline per lake, interpolating
 * between each lake's documented historical surface area and its current
 * (reported/estimated) surface area. This models the "Satellite Change
 * Detection" feature without requiring live satellite image processing,
 * which is explicitly out of scope for the hackathon MVP (see README).
 */

function generateSatelliteHistory(lake, startYear = 2016, endYear = 2026) {
  const { historicalAcres, currentAcres } = lake.area;
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const totalSteps = years.length - 1;
  const totalLossPct = (historicalAcres - currentAcres) / historicalAcres;

  return years.map((year, idx) => {
    // Non-linear: encroachment/degradation tends to accelerate in recent years
    const progress = idx / totalSteps;
    const accelerated = Math.pow(progress, 1.4);
    const waterSurfaceAcres = Math.round(historicalAcres - historicalAcres * totalLossPct * accelerated);
    const vegetationIndex = Number((0.75 - 0.35 * accelerated).toFixed(2));

    let encroachmentNote = "Stable, within historical range.";
    if (accelerated > 0.3 && accelerated <= 0.6) {
      encroachmentNote = "Early signs of shoreline encroachment / catchment land-use change detected.";
    } else if (accelerated > 0.6 && accelerated <= 0.85) {
      encroachmentNote = "Accelerating surface-area loss; encroachment visible on multiple sides.";
    } else if (accelerated > 0.85) {
      encroachmentNote = "Significant, sustained surface-area reduction consistent with documented reports.";
    }

    return { year, waterSurfaceAcres, vegetationIndex, encroachmentNote };
  });
}

module.exports = { generateSatelliteHistory };
