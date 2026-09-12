const mongoose = require("mongoose");

const LakeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    localName: { type: String },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    area: {
      historicalAcres: { type: Number }, // documented historical surface area
      currentAcres: { type: Number }, // documented/estimated current surface area
    },
    type: {
      type: String,
      enum: ["drinking_water_reservoir", "urban_lake", "recreational_lake"],
      default: "urban_lake",
    },
    primaryUse: { type: String }, // e.g. "Drinking water supply", "Urban recreation & flood buffer"
    knownIssues: [{ type: String }], // real, documented issues used to ground the demo
    population: {
      dependentPopulationEstimate: { type: Number }, // people relying on / around this water body
    },
    // Latest computed snapshot (kept denormalized for fast dashboard reads)
    latest: {
      waterLevelPct: Number,
      waterQualityPct: Number,
      droughtRisk: Number,
      pollutionRisk: Number,
      ecosystemStress: Number,
      overallRisk: Number,
      riskBand: { type: String, enum: ["SAFE", "WATCH", "HIGH", "CRITICAL"] },
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lake", LakeSchema);
