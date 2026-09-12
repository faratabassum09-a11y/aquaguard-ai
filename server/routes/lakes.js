const express = require("express");
const router = express.Router();
const {
  getAllLakes,
  getLakeById,
  getMeasurements,
  getSatelliteHistory,
  getExplanation,
  getAnomalies,
  getTimeMachine,
} = require("../controllers/lakeController");
const { getActionPlan } = require("../controllers/actionPlanController");
const { getCarbonCredit } = require("../controllers/carbonController");

router.get("/", getAllLakes);
router.get("/:id", getLakeById);
router.get("/:id/measurements", getMeasurements);
router.get("/:id/satellite", getSatelliteHistory);
router.get("/:id/explain", getExplanation);
router.get("/:id/anomalies", getAnomalies);
router.get("/:id/action-plan", getActionPlan);
router.get("/:id/carbon-credit", getCarbonCredit);
router.get("/:id/timemachine", getTimeMachine);

module.exports = router;
