const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    date: { type: String, required: true }, // for display only
  },
  { timestamps: true },
);

module.exports = mongoose.model("Schedule", scheduleSchema);
