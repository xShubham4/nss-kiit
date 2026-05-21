const express = require("express");
const router = express.Router();
const {
  createEvent, getEvents, getEvent, updateEvent, deleteEvent,
} = require("../controllers/event.controller");
const { protect } = require("../middleware/auth.middleware");
const { restrictTo } = require("../middleware/role.middleware");
const { upload } = require("../middleware/upload.middleware");

router.get("/", getEvents);
router.get("/:id", getEvent);
router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  upload.array("photos", 20),
  createEvent
);
router.patch("/:id", protect, restrictTo("admin", "superadmin"), updateEvent);
router.delete("/:id", protect, restrictTo("admin", "superadmin"), deleteEvent);

module.exports = router;