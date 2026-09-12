const express = require("express");
const router = express.Router();
const { subscribe, listSubscriptions, triggerAlert } = require("../controllers/alertController");

router.post("/subscribe", subscribe);
router.get("/subscriptions", listSubscriptions);
router.post("/:lakeId/trigger", triggerAlert);

module.exports = router;
