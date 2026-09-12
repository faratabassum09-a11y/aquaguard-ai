require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Lake = require("../models/Lake");
const Measurement = require("../models/Measurement");
const SatelliteObservation = require("../models/SatelliteObservation");
const Intervention = require("../models/Intervention");

const lakesData = require("./data/lakes");
const { generateMeasurements } = require("./generateMeasurements");
const { generateSatelliteHistory } = require("./generateSatellite");

const { computeRisk } = require("../services/riskService");
const { rankInterventions } = require("../services/optimizationService");
const { driversFromMeasurement } = require("../controllers/lakeController");

async function seed() {
  await connectDB();

  console.log("[seed] Clearing existing AQUAGUARD collections...");
  await Promise.all([
    Lake.deleteMany({}),
    Measurement.deleteMany({}),
    SatelliteObservation.deleteMany({}),
    Intervention.deleteMany({}),
  ]);

  for (const data of lakesData) {
    console.log(`[seed] Seeding ${data.name}...`);
    const lake = await Lake.create(data);

    // Measurements
    const measurements = generateMeasurements(data.slug).map((m) => ({ ...m, lakeId: lake._id }));
    await Measurement.insertMany(measurements);

    // Satellite history
    const satHistory = generateSatelliteHistory(data).map((s) => ({ ...s, lakeId: lake._id }));
    await SatelliteObservation.insertMany(satHistory);

    // Compute + store latest snapshot on the Lake document
    const latest = measurements[measurements.length - 1];
    const drivers = driversFromMeasurement(lake, latest, measurements);
    const risk = computeRisk(drivers);

    lake.latest = {
      waterLevelPct: latest.waterLevelPct,
      waterQualityPct: Math.max(0, 100 - latest.pollutionIndex),
      droughtRisk: risk.droughtRisk,
      pollutionRisk: risk.pollutionRisk,
      ecosystemStress: risk.ecosystemStress,
      overallRisk: risk.overallRisk,
      riskBand: risk.riskBand,
      updatedAt: new Date(),
    };
    await lake.save();

    // Pre-compute & store interventions for reference/history
    const optimization = rankInterventions(risk);
    const interventionDocs = optimization.ranked.map((i) => ({
      lakeId: lake._id,
      strategy: i.strategy,
      description: i.description,
      cost: i.cost,
      feasibility: i.feasibility,
      riskReductionPct: i.riskReductionPct,
      score: i.score,
    }));
    await Intervention.insertMany(interventionDocs);

    console.log(
      `        -> risk ${risk.overallRisk}/100 (${risk.riskBand}), top intervention: ${optimization.recommended.strategy}`
    );
  }

  console.log("\n[seed] Done. AQUAGUARD is seeded with 5 real Hyderabad water bodies.\n");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
