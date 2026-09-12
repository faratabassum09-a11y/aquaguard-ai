const express = require("express");
const router = express.Router();
const { optimize } = require("../controllers/optimizeController");

router.get("/:lakeId", optimize);

module.exports = router;
