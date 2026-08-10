const Subject = require("../models/subject.model");
const Student = require("../models/student.model");
const Exam = require("../models/examination.model");
const Schedule = require("../models/schedule.model");
module.exports = {
  getAllSubjects: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allSubjects = await Subject.find({ school: schoolId });
      res.status(200).json({
        success: true,
        message: "Success In fetching all Subjects",
        data: allSubjects,
      });
    } catch (error) {
      console.log("GetAllSubjects error", error);
      res.status(500).json({
        success: false,
        messsage: "Server error in getting all Subjects.",
      });
    }
  },
  createSubject: async (req, res) => {
    try {
      if (!req.user || !req.user.schoolId) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Missing schoolId in user context",
          });
      }

      const newSubject = new Subject({
        school: req.user.schoolId,
        subject_name: req.body.subject_name,
        subject_codename: req.body.subject_codename,
      });

      await newSubject.save();
      res
        .status(201)
        .json({
          success: true,
          message: "Successfully created the Subject",
          data: newSubject,
        });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error in creating Subject." });
    }
  },
  updateSubjectwithId: async (req, res) => {
    try {
      let id = req.params.id;
      await Subject.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const SubjectAfterUpdate = await Subject.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Subject Updated. ",
        data: SubjectAfterUpdate,
      });
    } catch (error) {
      console.log("Update Subject Error=>", error);
      res
        .status(500)
        .json({ success: false, messsage: "Server error in updating Subject." });
    }
  },
deleteSubjectwithId: async (req, res) => {
  try {
    const id = req.params.id;
    const schoolId = req.user.schoolId;

    // Use countDocuments for efficiency
    const subjectStudentCount = await Student.countDocuments({
      subject: id,
      school: schoolId,
    });

    const subjectExamCount = await Exam.countDocuments({
      subject: id,
      school: schoolId,
    });

    const subjectScheduleCount = await Schedule.countDocuments({
      subject: id,
      school: schoolId,
    });

    if (
      subjectStudentCount === 0 &&
      subjectExamCount === 0 &&
      subjectScheduleCount === 0
    ) {
      const deleted = await Subject.findOneAndDelete({ _id: id, school: schoolId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      return res.status(200).json({ success: true, message: "Subject deleted successfully" });
    } else {
      return res.status(409).json({
        success: false,
        message: "This subject is already in use and cannot be deleted",
      });
    }
  } catch (error) {
    console.error("Delete subject error =>", error);
    res.status(500).json({ success: false, message: "Server error in deleting subject" });
  }
},

};
