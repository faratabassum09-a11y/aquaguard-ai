const express = require("express");
const router = express.Router();
const {
  regionalSimulate,
  regionalOptimize,
  cascadeSimulate,
  regionalTimeMachine,
} = require("../controllers/regionalController");

router.post("/simulate", regionalSimulate);
router.post("/optimize", regionalOptimize);
router.post("/cascade", cascadeSimulate);
router.get("/timemachine", regionalTimeMachine);

module.exports = router;
