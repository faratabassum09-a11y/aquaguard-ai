const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const { computeRegionalScenario, computeRegionalOptimize } = require("../services/regionalService");
const { propagateStress, getEdges } = require("../services/cascadeService");
const { buildTimeline } = require("../services/timeMachineService");

function normalizeScenario(body) {
  return {
    rainfallChangePct: Number(body.rainfallChangePct) || 0,
    temperatureChangeC: Number(body.temperatureChangeC) || 0,
    extractionChangePct: Number(body.extractionChangePct) || 0,
    urbanizationChangePct: Number(body.urbanizationChangePct) || 0,
    runoffChangePct: Number(body.runoffChangePct) || 0,
  };
}

/**
 * Runs the SAME what-if scenario across every lake simultaneously.
 * This is what powers the "Regional What-If" map view - the differentiator
 * over a single-site dashboard: one slider, the whole watershed reacts.
 */
async function regionalSimulate(req, res) {
  try {
    const scenario = normalizeScenario(req.body);
    const result = await computeRegionalScenario(scenario);

    // Push a live alert for any lake the scenario just tipped into CRITICAL -
    // ties the "what-if" feature into the live alert feed for a stronger demo.
    const io = req.app.get("io");
    if (io) {
      for (const r of result.newlyCriticalLakes) {
        io.emit("alert", {
          id: `${Date.now()}-${r.lakeId}`,
          lakeId: r.lakeId,
          lakeName: r.name,
          message: `${r.name}: simulated scenario pushes risk to CRITICAL (${r.projectedRisk}/100). Immediate intervention recommended.`,
          severity: "critical",
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({ scenario: result.scenario, lakes: result.lakes, summary: result.summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Cross-lake budget optimizer - allocates a limited budget across all lakes
 * for maximum total watershed-wide risk reduction. See regionalService.js.
 */
async function regionalOptimize(req, res) {
  try {
    const budgetInr = Number(req.body.budgetInr) || 5000000;
    const result = await computeRegionalOptimize(budgetInr);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * "Watershed Cascade Network" - runs a regional scenario, then propagates
 * upstream reservoir stress downstream along the real Osman Sagar /
 * Himayat Sagar -> Musi chain -> Hussain Sagar connection (cascadeService.js).
 */
async function cascadeSimulate(req, res) {
  try {
    const scenario = normalizeScenario(req.body);
    const result = await computeRegionalScenario(scenario);

    const bySlug = {};
    for (const r of result.lakes) bySlug[r.slug] = r;

    const propagated = propagateStress(bySlug);

    res.json({
      scenario: result.scenario,
      edges: getEdges(),
      nodes: Object.values(propagated),
      summary: result.summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * "Watershed Time Machine" (regional view) - month-by-month risk trajectory
 * for every lake at once, so the map can be scrubbed through 24 months of
 * real measurement history. See timeMachineService.js.
 */
async function regionalTimeMachine(req, res) {
  try {
    const lakes = await Lake.find();
    const perLake = [];

    for (const lake of lakes) {
      const measurements = await Measurement.find({ lakeId: lake._id }).sort({ date: 1 });
      if (!measurements.length) continue;
      const timeline = buildTimeline(lake, measurements);
      perLake.push({
        lakeId: lake._id,
        name: lake.name,
        slug: lake.slug,
        location: lake.location,
        timeline,
      });
    }

    const months = perLake.length ? perLake[0].timeline.length : 0;
    res.json({ months, lakes: perLake });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { regionalSimulate, regionalOptimize, cascadeSimulate, regionalTimeMachine };
