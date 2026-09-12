/**
 * agentService.js
 *
 * The "Agentic AI Assistant" layer. Previously, AQUAGUARD's assistant could
 * only narrate a pre-loaded snapshot of a lake's current risk/optimization
 * context. This service lets it actually DO things: a judge can type
 * "what if rainfall drops 30%?" and the assistant will parse that into a
 * real scenario, run it through the SAME simulationService/riskService used
 * by the What-If Simulator, and report the real computed numbers — not a
 * plausible-sounding guess.
 *
 * Deliberately deterministic and dependency-free (regex/keyword parsing,
 * no LLM call for the parsing step itself) so it works identically whether
 * or not an LLM_API_KEY is configured, matching the rest of AQUAGUARD's
 * "works fully offline for a demo" philosophy (see aiService.js). The
 * parsed scenario is always surfaced back to the user transparently
 * (`parseNotes`) so nothing is hidden even when parsing is approximate.
 */

const { runSimulation } = require("./simulationService");
const { rankInterventions } = require("./optimizationService");
const { computeRegionalScenario, computeRegionalOptimize } = require("./regionalService");

const SCENARIO_FIELDS = [
  { key: "rainfallChangePct", words: ["rainfall", "monsoon", "precipitation", "rain"], unit: "%" },
  { key: "temperatureChangeC", words: ["temperature", "warming", "warmer", "hotter", "heat"], unit: "°C" },
  { key: "extractionChangePct", words: ["extraction", "withdrawal", "pumping", "water draw", "groundwater draw"], unit: "%" },
  { key: "urbanizationChangePct", words: ["urbanization", "urban growth", "development", "concretization", "construction"], unit: "%" },
  { key: "runoffChangePct", words: ["runoff", "sewage", "pollution", "nutrient", "effluent"], unit: "%" },
];

const DECREASE_WORDS = [
  "drop", "drops", "dropped", "fall", "falls", "fell", "decrease", "decreases", "decreased",
  "reduce", "reduces", "reduced", "less", "down", "cut", "lower", "shortage", "deficit", "shrink", "shrinks",
];
const INCREASE_WORDS = [
  "increase", "increases", "increased", "rise", "rises", "rose", "grow", "grows", "grew",
  "more", "up", "surge", "spike", "double", "doubled", "higher", "jump", "jumps",
];

function parseScenario(question) {
  const q = question.toLowerCase();
  const scenario = {};
  const notes = [];

  for (const field of SCENARIO_FIELDS) {
    for (const word of field.words) {
      const idx = q.indexOf(word);
      if (idx === -1) continue;

      const windowStart = Math.max(0, idx - 20);
      const windowEnd = Math.min(q.length, idx + word.length + 30);
      const windowText = q.slice(windowStart, windowEnd);
      const numMatch = windowText.match(/(\d+(?:\.\d+)?)\s*(%|percent|degrees?|c\b)?/);
      if (!numMatch) continue;

      const magnitude = parseFloat(numMatch[1]);
      const hasDecrease = DECREASE_WORDS.some((w) => windowText.includes(w));
      const hasIncrease = INCREASE_WORDS.some((w) => windowText.includes(w));

      let sign = 1;
      if (hasDecrease && !hasIncrease) sign = -1;
      else if (hasIncrease && !hasDecrease) sign = 1;
      else sign = field.key === "rainfallChangePct" ? -1 : 1; // sensible default: rainfall questions default to deficit

      scenario[field.key] = Math.round(magnitude * sign * 10) / 10;
      notes.push(`${field.key} ${sign > 0 ? "+" : ""}${scenario[field.key]}${field.unit} (parsed from "${word}")`);
      break; // one match per field
    }
  }

  return { scenario, notes, hasScenario: Object.keys(scenario).length > 0 };
}

function parseBudgetInr(question) {
  const q = question.toLowerCase();
  if (!/budget|fund|allocate|spend|invest|crore|lakh|rupee|₹|inr/.test(q)) return null;

  let match = q.match(/(\d+(?:\.\d+)?)\s*crore/);
  if (match) return Math.round(parseFloat(match[1]) * 1e7);

  match = q.match(/(\d+(?:\.\d+)?)\s*lakh/);
  if (match) return Math.round(parseFloat(match[1]) * 1e5);

  match = q.match(/₹\s*([\d,]+(?:\.\d+)?)/);
  if (match) return Math.round(parseFloat(match[1].replace(/,/g, "")));

  match = q.match(/([\d,]+(?:\.\d+)?)\s*(rupees|inr)/);
  if (match) return Math.round(parseFloat(match[1].replace(/,/g, "")));

  return null;
}

function isRegionalQuery(question) {
  return /all lakes|entire watershed|whole watershed|across the region|region[- ]wide|every lake|watershed[- ]wide|all five lakes/i.test(
    question
  );
}

/**
 * @returns {Promise<null | { type, scenario?, parseNotes?, summary, data }>}
 * null means "no executable action detected — let the assistant answer conversationally instead".
 */
async function runAgent({ lake, question, baselineDrivers, baselineRisk }) {
  const budgetInr = parseBudgetInr(question);
  if (budgetInr) {
    const result = await computeRegionalOptimize(budgetInr);
    return {
      type: "regional_optimize",
      summary:
        `Ran a live watershed budget optimizer for ₹${budgetInr.toLocaleString("en-IN")}: funded ` +
        `${result.lakesFundedCount}/${result.lakesTotalCount} lakes for a combined ${result.totalRiskReductionPts} ` +
        `risk-reduction points (₹${result.totalSpent.toLocaleString("en-IN")} of ₹${budgetInr.toLocaleString("en-IN")} allocated).`,
      data: result,
    };
  }

  const { scenario, notes, hasScenario } = parseScenario(question);
  if (!hasScenario) return null;

  if (isRegionalQuery(question)) {
    const result = await computeRegionalScenario(scenario);
    return {
      type: "regional_simulate",
      scenario,
      parseNotes: notes,
      summary:
        `Ran this scenario live across all ${result.lakes.length} lakes: average watershed risk moves from ` +
        `${result.summary.avgBaseline}/100 to ${result.summary.avgProjected}/100, with ${result.summary.newlyCritical} ` +
        `lake(s) newly tipping into CRITICAL.`,
      data: result,
    };
  }

  const result = runSimulation(baselineDrivers, scenario);
  const optimization = rankInterventions(result.projected);
  return {
    type: "simulate",
    scenario,
    parseNotes: notes,
    summary:
      `Ran a live simulation for ${lake.name}: overall risk moves from ${baselineRisk.overallRisk}/100 ` +
      `(${baselineRisk.riskBand}) to ${result.projected.overallRisk}/100 (${result.projected.riskBand}). ` +
      `Top recommended response after this scenario: "${optimization.recommended.strategy}" ` +
      `(projected risk ${optimization.recommended.projectedRisk}/100).`,
    data: { projected: result.projected, projectedDrivers: result.projectedDrivers, optimization },
  };
}

module.exports = { runAgent, parseScenario, parseBudgetInr, isRegionalQuery };
