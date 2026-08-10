const Schedule = require("../models/schedule.model");

module.exports = {
  getScheduleWithClass: async (req, res) => {
    try {
      let query = {
        school: req.user.schoolId,
        class: req.params.id,
      };

      // Only apply teacher filter if specifically requested via URL param
      if (req.query.mySchedule === "true") {
        query.teacher = req.user.id;
      }

      const schedules = await Schedule.find(query)
        .populate("teacher", "name")
        .populate("subject", "subject_name");

      const data = schedules.map((s) => ({
        _id: s._id,
        subject: s.subject,
        teacher: s.teacher,
        start: new Date(s.startTime),
        end: new Date(s.endTime),
      }));

      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error fetching data." });
    }
  },
  createSchedule: async (req, res) => {
    try {
      const { classId, startTime, endTime, date } = req.body;

      // ✅ Check if another schedule overlaps
      const conflict = await Schedule.findOne({
        class: classId,
        date,
        $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "⚠️ A schedule already exists for this time slot.",
        });
      }

      const newSchedule = new Schedule({
        school: req.user.schoolId,
        teacher: req.body.teacher,
        subject: req.body.subject,
        class: classId,
        startTime,
        endTime,
        date,
      });

      await newSchedule.save();
      res.status(200).json({ success: true, message: "Schedule created." });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  updateScheduleWithId: async (req, res) => {
    try {
      const data = await Schedule.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true },
      );
      res
        .status(200)
        .json({ success: true, message: "Updated successfully.", data });
    } catch (err) {
      res.status(500).json({ success: false, message: "Update failed." });
    }
  },

  deleteScheduleWithId: async (req, res) => {
    try {
      await Schedule.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: "Deleted successfully." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Delete failed." });
    }
  },
};
