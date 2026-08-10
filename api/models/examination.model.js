const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
  examDate: {
    type: Date,
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
  },
  examType: {
    type: String,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  period: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now, // Evaluates dynamically at document creation
  },
});

module.exports = mongoose.model("Examination", examinationSchema);
