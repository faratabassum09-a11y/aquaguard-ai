const mongoose = require("mongoose");

const SimulationSchema = new mongoose.Schema(
  {
    lakeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lake", required: true, index: true },
    inputs: {
      rainfallChangePct: Number,
      temperatureChangeC: Number,
      extractionChangePct: Number,
      urbanizationChangePct: Number,
      runoffChangePct: Number,
    },
    baselineRisk: Number,
    projectedRisk: Number,
    breakdown: {
      rainfall: Number,
      temperature: Number,
      extraction: Number,
      urbanization: Number,
      runoff: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Simulation", SimulationSchema);
