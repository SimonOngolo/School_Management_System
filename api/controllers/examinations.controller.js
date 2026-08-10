const Examination = require("../models/examination.model");

module.exports = {

  newExamination: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      
      const { date, subjectId, examType, classId, period } = req.body;

      const newExamination = new Examination({
        school: schoolId,
        examDate: date,
        period: period,
        subject: subjectId,
        examType,
        class: classId,
      });

      const savedData = await newExamination.save();
      const populatedData = await savedData.populate([
        { path: "subject", select: "subject_name" },
        { path: "class", select: "class_text" },
      ]);

      res.status(200).json({
        success: true,
        message: "Examination created successfully",
        data: populatedData,
      });
    } catch (error) {
      console.error("Create Examination Error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating examination",
      });
    }
  },

  // Get all examinations for the school
  getAllExaminations: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const examinations = await Examination.find({ school: schoolId })
        .populate("subject", "subject_name")
        .populate("class", "class_text");

      res.status(200).json({
        success: true,
        examinations,
      });
    } catch (error) {
      console.error("Get All Examinations Error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching examinations",
      });
    }
  },

  // Get examinations by class
  getExaminationsByClass: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const classId = req.params.id;
      const examinations = await Examination.find({
        class: classId,
        school: schoolId,
      })
        .populate("subject", "subject_name")
        .populate("class", "class_text");

      res.status(200).json({
        success: true,
        examinations,
      });
    } catch (error) {
      console.error("Get Examinations By Class Error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching examinations by class",
      });
    }
  },

  // Update examination by ID
  updateExaminationWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const examinationId = req.params.id;
      // Destructure classId and period so updates are committed during form edits
      const { date, subjectId, examType, classId, period } = req.body;

      await Examination.findOneAndUpdate(
        { _id: examinationId, school: schoolId },
        {
          $set: {
            examDate: date,
            subject: subjectId,
            examType: examType,
            class: classId, // 👈 Updates class modifications
            period: period, // 👈 Updates period modifications
          },
        },
        { returnDocument: "after" }, // ✅ replaces deprecated new:true
      );

      res.status(200).json({
        success: true,
        message: "Examination updated successfully.",
      });
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(500).json({
        success: false,
        message: "Error updating examination.",
      });
    }
  },

  // Delete examination by ID
  deleteExaminationWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const examinationId = req.params.id;

      await Examination.findOneAndDelete({
        _id: examinationId,
        school: schoolId,
      });

      res.status(200).json({
        success: true,
        message: "Examination deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting examination.",
      });
    }
  },
};
