const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true }, // Cloudinary public_id for deletion
  caption: { type: String, default: "" },
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    photos: {
      type: [photoSchema],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 20,
        message: "An event must have between 1 and 20 photos.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast unit-based queries
eventSchema.index({ unit: 1, date: -1 });

module.exports = mongoose.model("Event", eventSchema);