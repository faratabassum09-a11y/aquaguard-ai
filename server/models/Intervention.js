const mongoose = require("mongoose");

const InterventionSchema = new mongoose.Schema(
  {
    lakeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lake", required: true, index: true },
    strategy: { type: String, required: true },
    description: { type: String },
    cost: { type: String, enum: ["Low", "Medium", "High"], required: true },
    feasibility: { type: String, enum: ["Low", "Medium", "High"], required: true },
    riskReductionPct: { type: Number, required: true }, // estimated percentage points of risk reduced
    score: { type: Number }, // computed composite score
  },
  { timestamps: true }
);

module.exports = mongoose.model("Intervention", InterventionSchema);
