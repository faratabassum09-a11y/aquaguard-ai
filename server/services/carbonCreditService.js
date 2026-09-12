/**
 * carbonCreditService.js
 *
 * Estimates the climate-finance potential of a lake restoration plan: how
 * much vegetation/wetland area the recommended intervention could restore,
 * how much CO2e that could sequester annually, and a rough market value at
 * typical voluntary carbon market (VCM) prices.
 *
 * This is a deliberately conservative, clearly-labeled illustrative
 * estimate (see the "assumptions" field returned to the client) - the
 * point is to demonstrate the *category* of value (climate finance can
 * help fund lake restoration), not to certify a tradeable credit figure.
 * Real MRV (measurement, reporting, verification) would be required
 * before any of this could back an actual carbon credit.
 */

// Illustrative, documented-ballpark assumptions (kept explicit and visible,
// never silently baked in) - wetland/riparian restoration sequestration
// rates in published literature commonly range ~3-8 tCO2e/acre/year;
// we use a conservative mid-range figure.
const CO2_TONNES_PER_ACRE_PER_YEAR = 5;
const VCM_PRICE_USD_PER_TONNE = 8; // conservative voluntary carbon market average
const USD_TO_INR = 83;

function estimateCarbonCredit({ lake, optimization, encroachmentPct }) {
  const historicalAcres = lake.area?.historicalAcres || 0;
  const currentAcres = lake.area?.currentAcres || historicalAcres;
  const lostAcres = Math.max(0, historicalAcres - currentAcres);

  // Assume the recommended intervention could realistically restore a
  // fraction of the lost area proportional to its risk-reduction share of
  // the total possible reduction (a rough, transparent proxy - not a
  // hydrological restoration model).
  const recommended = optimization.recommended;
  const restorationFraction = Math.min(1, recommended.riskReductionPct / Math.max(1, optimization.withoutAction));
  const restorableAcres = Math.round(lostAcres * restorationFraction * 10) / 10;

  const annualCO2Tonnes = Math.round(restorableAcres * CO2_TONNES_PER_ACRE_PER_YEAR);
  const annualValueUsd = Math.round(annualCO2Tonnes * VCM_PRICE_USD_PER_TONNE);
  const annualValueInr = Math.round(annualValueUsd * USD_TO_INR);

  return {
    lostAcres: Math.round(lostAcres * 10) / 10,
    restorableAcres,
    annualCO2Tonnes,
    annualValueUsd,
    annualValueInr,
    tenYearValueInr: annualValueInr * 10,
    assumptions: {
      co2TonnesPerAcrePerYear: CO2_TONNES_PER_ACRE_PER_YEAR,
      vcmPriceUsdPerTonne: VCM_PRICE_USD_PER_TONNE,
      usdToInr: USD_TO_INR,
      note:
        "Illustrative estimate using conservative published wetland-restoration sequestration " +
        "ranges (3-8 tCO2e/acre/year) and voluntary carbon market pricing. Not a certified credit " +
        "figure - real deployment would require formal MRV (measurement, reporting, verification).",
    },
  };
}

module.exports = { estimateCarbonCredit };
