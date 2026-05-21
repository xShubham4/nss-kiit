const Event = require("../models/Event");
const { cloudinary } = require("../config/cloudinary");

// POST /api/events  (admin only)
const createEvent = async (req, res) => {
  try {
    const { title, summary, date, captions } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one photo is required" });
    }

    const captionsArr = captions ? JSON.parse(captions) : [];
    const photos = req.files.map((file, i) => ({
      url: file.path,
      publicId: file.filename,
      caption: captionsArr[i] || "",
    }));

    const event = await Event.create({
      title,
      summary,
      date,
      photos,
      unit: req.user.unit,
      createdBy: req.user.id,
    });

    await event.populate("unit", "name slug");
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/events  (public)
const getEvents = async (req, res) => {
  try {
    const { unit, page = 1, limit = 12 } = req.query;
    const filter = { isPublished: true };
    if (unit) filter.unit = unit;

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("unit", "name slug")
        .populate("createdBy", "name")
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      events,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/events/:id  (public)
const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, isPublished: true })
      .populate("unit", "name slug")
      .populate("createdBy", "name");

    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/events/:id  (admin — own unit only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    // Admins can only update their own unit's events
    if (
      req.user.role === "admin" &&
      event.unit.toString() !== req.user.unit.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this event" });
    }

    const { title, summary, date } = req.body;
    if (title) event.title = title;
    if (summary) event.summary = summary;
    if (date) event.date = date;

    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/events/:id  (admin — own unit only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (
      req.user.role === "admin" &&
      event.unit.toString() !== req.user.unit.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
    }

    // Delete photos from Cloudinary
    await Promise.all(
      event.photos.map((photo) => cloudinary.uploader.destroy(photo.publicId))
    );

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent };