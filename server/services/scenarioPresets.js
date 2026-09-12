/**
 * scenarioPresets.js
 *
 * One-click scenario presets for the What-If Simulator, calibrated to be
 * directionally consistent with real, reported Telangana/Hyderabad climate
 * patterns (2015 was a widely reported deficient-monsoon/drought year in
 * Telangana; long-range climate assessments project continued warming and
 * heavier bursts interspersed with dry spells for the Deccan plateau).
 * These are illustrative presets for demo purposes, not an official
 * seasonal outlook.
 */

const SCENARIO_PRESETS = [
  {
    id: "normal-monsoon",
    label: "Normal Monsoon Year",
    description: "An average year with typical rainfall and demand.",
    values: { rainfallChangePct: 0, temperatureChangeC: 0, extractionChangePct: 0, urbanizationChangePct: 0, runoffChangePct: 0 },
  },
  {
    id: "drought-2015",
    label: "2015-Style Deficient Monsoon",
    description: "Rainfall well below average, as widely reported across Telangana in 2015.",
    values: { rainfallChangePct: -30, temperatureChangeC: 1.5, extractionChangePct: 10, urbanizationChangePct: 2, runoffChangePct: 4 },
  },
  {
    id: "severe-drought",
    label: "Severe Multi-Year Drought",
    description: "Compounding rainfall deficit and extraction pressure over consecutive dry years.",
    values: { rainfallChangePct: -45, temperatureChangeC: 2.5, extractionChangePct: 20, urbanizationChangePct: 5, runoffChangePct: 6 },
  },
  {
    id: "climate-2050",
    label: "2050 Climate Stress Outlook",
    description: "Illustrative long-range warming + urban growth scenario for the Deccan plateau.",
    values: { rainfallChangePct: -20, temperatureChangeC: 3, extractionChangePct: 30, urbanizationChangePct: 25, runoffChangePct: 15 },
  },
  {
    id: "rapid-urbanization",
    label: "Rapid Urbanization Shock",
    description: "Fast catchment development with limited runoff controls, no major rainfall change.",
    values: { rainfallChangePct: -5, temperatureChangeC: 0.5, extractionChangePct: 15, urbanizationChangePct: 35, runoffChangePct: 25 },
  },
];

module.exports = { SCENARIO_PRESETS };
