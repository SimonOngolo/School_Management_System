const express = require("express");
const authMiddleware = require("../auth/auth");
const { getAttendance, markAttendance, checkAttendance } = require("../controllers/attendance.controller");

const router = express.Router();

// ✅ Protect the create route with authMiddleware
router.post("/mark", authMiddleware(["TEACHER"]), markAttendance);
router.get("/:studentId", authMiddleware(["SCHOOL","STUDENT"]), getAttendance);
router.get(
  "/check/:classId",
  authMiddleware(["TEACHER", ]),
  checkAttendance,
); // AUTHENTICATED USER FOR UPDATE

module.exports = router;
