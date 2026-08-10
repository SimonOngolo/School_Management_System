const Class = require("../models/class.model");
const Student = require("../models/student.model");
const Exam = require("../models/examination.model");
const Schedule = require("../models/schedule.model");

module.exports = {
  getAllClasses: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allClasses = await Class.find({ school: schoolId });
      res
        .status(200)
        .json({ success: true, message: "Success", data: allClasses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getSingleClass: async (req, res) => {
    try {
      const singleClass = await Class.findOne({
        _id: req.params.id,
        school: req.user.schoolId,
      }).populate("attendee");
      res.status(200).json({ success: true, data: singleClass });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
getAttendeeClass: async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const attendeeId = req.user.id;
    const classes = await Class.find({school: schoolId, attendee: attendeeId });
    
    res.status(200).json({ success: true, message: "Success in getting attendee classes", data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error in getting attendee classes" });
  }
},

  postAttendance: async (req, res) => {
    try {
      const { classId, attendanceData } = req.body;
      const newAttendance = await Attendance.create({
        class: classId,
        date: new Date(),
        records: attendanceData,
        teacher: req.user._id,
      });
      res.status(201).json({ success: true, message: "Attendance saved!" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error saving attendance" });
    }
  },

  createClass: async (req, res) => {
    try {
      const newClass = new Class({
        school: req.user.schoolId,
        class_text: req.body.class_text,
        class_num: req.body.class_num,
        attendee: req.body.attendee,
      });
      await newClass.save();
      res.status(201).json({ success: true, data: newClass });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  updateClasswithId: async (req, res) => {
    try {
      let id = req.params.id;
      await Class.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
      const classAfterUpdate = await Class.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Class Updated.",
        data: classAfterUpdate,
      });
    } catch (error) {
      console.log("Update class Error=>", error);
      res
        .status(500)
        .json({ success: false, message: "Server error in updating class." });
    }
  },

  deleteClasswithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const classStudentCount = await Student.countDocuments({
        student_class: id,
        school: schoolId,
      });

      const classExamCount = await Exam.countDocuments({
        class: id,
        school: schoolId,
      });

      const classScheduleCount = await Schedule.countDocuments({
        class: id,
        school: schoolId,
      });

      if (
        classStudentCount === 0 &&
        classExamCount === 0 &&
        classScheduleCount === 0
      ) {
        const deleted = await Class.findOneAndDelete({
          _id: id,
          school: schoolId,
        });
        if (!deleted) {
          return res
            .status(404)
            .json({ success: false, message: "Class not found" });
        }
        return res
          .status(200)
          .json({ success: true, message: "Class deleted successfully" });
      } else {
        return res.status(409).json({
          success: false,
          message: "This class is already in use and cannot be deleted",
        });
      }
    } catch (error) {
      console.error("Delete class error =>", error);
      res
        .status(500)
        .json({ success: false, message: "Server error in deleting class" });
    }
  },
};
