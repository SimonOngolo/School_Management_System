const Attendance = require("../models/attendance.model");
require("../models/student.model");
const moment = require("moment");

module.exports = {
  markAttendance: async (req, res) => {
    try {
      const { studentId, date, status, classId } = req.body;
      const schoolId = req.user.schoolId;

      const newAttendance = new Attendance({
        student: studentId,
        date,
        status,
        class: classId,
        school: schoolId,
      });

      await newAttendance.save();
      res.status(201).json(newAttendance);
    } catch (error) {
      console.error("DETAILED ATTENDANCE ERROR:", error); // 👉 This will now show the exact reason in your terminal
      res
        .status(500)
        .json({ success: false, message: "Error in marking attendance", error: error.message });
    }
  },

getAttendance: async (req, res) => {
    try {
      const { studentId } = req.params;
      
      if (!studentId || studentId === "undefined" || studentId === "null") {
        return res.status(400).json({ success: false, message: "Invalid student ID provided" });
      }

      // Removed .populate("student") to completely bypass the schema error
      const attendance = await Attendance.find({ student: studentId });
      
      res.status(200).json(attendance);
    } catch (error) {
      console.error("DETAILED ATTENDANCE ERROR:", error);
      res
        .status(500)
        .json({ success: false, message: "Error in getting attendance", error: error.message });
    }
  },

  checkAttendance: async (req, res) => {
    const { classId } = req.params;
    try {
      const today = moment().startOf("day");
      const attendanceForToday = await Attendance.findOne({
        class: classId,
        date: {
          $gte: today.toDate(),
          $lt: moment(today).endOf("day").toDate(),
        },
      });

      if (attendanceForToday) {
        return res.status(200).json({
          attendanceTaken: true,
          message: "Attendance already taken",
        });
      } else {
        res.status(200).json({
          attendanceTaken: false,
          message: "No Attendance taken today",
        });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error in checking attendance", error: error.message });
    }
  },
};
