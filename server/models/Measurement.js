const mongoose = require("mongoose");

const MeasurementSchema = new mongoose.Schema({
  lakeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lake", required: true, index: true },
  date: { type: Date, required: true },
  rainfallMm: { type: Number, required: true }, // monthly rainfall
  temperatureC: { type: Number, required: true }, // mean monthly temperature
  waterLevelPct: { type: Number, required: true }, // % of full tank level / capacity
  extractionMld: { type: Number, required: true }, // million litres/day withdrawn
  pollutionIndex: { type: Number, required: true }, // 0-100, higher = more polluted (BOD/COD/coliform proxy)
});

MeasurementSchema.index({ lakeId: 1, date: 1 });

module.exports = mongoose.model("Measurement", MeasurementSchema);
