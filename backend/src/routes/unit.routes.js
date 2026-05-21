const express = require("express");
const router = express.Router();
const { getUnits, getUnit } = require("../controllers/unit.controller");

router.get("/", getUnits);
router.get("/:slug", getUnit);

module.exports = router;