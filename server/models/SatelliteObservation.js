const mongoose = require("mongoose");

const SatelliteObservationSchema = new mongoose.Schema({
  lakeId: { type: mongoose.Schema.Types.ObjectId, ref: "Lake", required: true, index: true },
  year: { type: Number, required: true },
  waterSurfaceAcres: { type: Number, required: true },
  vegetationIndex: { type: Number }, // NDVI-style proxy, 0-1
  encroachmentNote: { type: String }, // short human-readable note for that year
});

module.exports = mongoose.model("SatelliteObservation", SatelliteObservationSchema);
