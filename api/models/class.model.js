const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
  class_text: {
    type: String,
    required: true,
  },
  class_num: {
    type: String,
    required: true,
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
    module.exports = mongoose.model('Class', classSchema);
