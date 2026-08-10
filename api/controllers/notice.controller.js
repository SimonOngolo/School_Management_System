const Notice = require("../models/Notice.model");

module.exports = {
  // 1. FIXED: Now includes the audience property in the returned payload mapping!
  getAllNotices: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allNotices = await Notice.find({ school: schoolId });

      // If no notices are found, return a clear, user-friendly message
      if (!allNotices || allNotices.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No notices found for this school.",
          data: [],
        });
      }

      // 💡 FIX: Keep 'audience' in the response so frontend tabs can filter it!
      const sanitizedNotices = allNotices.map((notice) => ({
        _id: notice._id,
        title: notice.title,
        Title: notice.title, // Keep fallback casing compatibility intact
        message: notice.message,
        audience: notice.audience, // 🔥 Added this missing field
      }));

      res.status(200).json({
        success: true,
        message: "Success In fetching all Notices",
        data: sanitizedNotices,
      });
    } catch (error) {
      console.log("GetAllNotices error", error);
      res.status(500).json({
        success: false,
        message: "Server error in getting all Notices.",
      });
    }
  },

  createNotice: async (req, res) => {
    try {
      if (!req.user || !req.user.schoolId) {
        return res.status(400).json({
          success: false,
          message: "Missing schoolId in user context",
        });
      }

      const { Title, title, message, audience } = req.body;

      const newNotice = new Notice({
        school: req.user.schoolId,
        title: title || Title,
        message: message,
        audience: audience || "all",
      });

      await newNotice.save();
      res.status(201).json({
        success: true,
        message: "Successfully created the Notice",
        data: newNotice,
      });
    } catch (err) {
      console.log("Create Notice Error=>", err);
      res
        .status(500)
        .json({ success: false, message: "Server error in creating Notice." });
    }
  },

  updateNoticewithId: async (req, res) => {
    try {
      let id = req.params.id;
      const { Title, message, audience } = req.body; // 💡 Grab audience in updates too

      const updateData = { message };
      if (Title) updateData.title = Title;
      if (req.body.title) updateData.title = req.body.title;
      if (audience) updateData.audience = audience; // Save target modifications seamlessly

      const NoticeAfterUpdate = await Notice.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { returnDocument: "after" },
      );

      res.status(200).json({
        success: true,
        message: "Notice Updated.",
        data: NoticeAfterUpdate,
      });
    } catch (error) {
      console.log("Update Notice Error=>", error);
      res
        .status(500)
        .json({ success: false, message: "Server error in updating Notice." });
    }
  },

  deleteNoticewithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      let NoticeStudentCount = 0;
      let NoticeExamCount = 0;
      let NoticeScheduleCount = 0;

      if (typeof Student !== "undefined") {
        NoticeStudentCount = await Student.countDocuments({
          student_Notice: id,
          school: schoolId,
        }).catch(() => 0);
      }
      if (typeof Exam !== "undefined") {
        NoticeExamCount = await Exam.countDocuments({
          Notice: id,
          school: schoolId,
        }).catch(() => 0);
      }
      if (typeof Schedule !== "undefined") {
        NoticeScheduleCount = await Schedule.countDocuments({
          Notice: id,
          school: schoolId,
        }).catch(() => 0);
      }

      if (
        NoticeStudentCount === 0 &&
        NoticeExamCount === 0 &&
        NoticeScheduleCount === 0
      ) {
        const deleted = await Notice.findByIdAndDelete(id);

        if (!deleted) {
          return res
            .status(404)
            .json({ success: false, message: "Notice not found" });
        }
        return res
          .status(200)
          .json({ success: true, message: "Notice deleted successfully" });
      } else {
        return res.status(409).json({
          success: false,
          message: "This Notice is already in use and cannot be deleted",
        });
      }
    } catch (error) {
      console.error("Delete Notice error =>", error);
      res
        .status(500)
        .json({ success: false, message: "Server error in deleting Notice" });
    }
  },
};
