const Unit = require("../models/Unit");

// GET /api/units  (public)
const getUnits = async (req, res) => {
  try {
    const units = await Unit.find().sort({ name: 1 });
    res.json({ success: true, units });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/units/:slug  (public)
const getUnit = async (req, res) => {
  try {
    const unit = await Unit.findOne({ slug: req.params.slug });
    if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });
    res.json({ success: true, unit });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getUnits, getUnit };