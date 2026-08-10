const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  // This 'groupe' field will now store the ID of the Field/Group selected
  groupe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  date_naissance: { type: String, required: true },
  lieu_naissance: { type: String, required: true },
  bac: { type: String, required: true },
  ecole_origine: { type: String, required: true },
  student_image: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Students", studentSchema);
