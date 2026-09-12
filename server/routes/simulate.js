const express = require("express");
const router = express.Router();
const { simulate } = require("../controllers/simulationController");
const { SCENARIO_PRESETS } = require("../services/scenarioPresets");

router.get("/presets", (req, res) => res.json(SCENARIO_PRESETS));
router.post("/", simulate);

module.exports = router;
