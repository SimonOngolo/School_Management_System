const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createSchedule,
  getScheduleWithClass,
  updateScheduleWithId,
  deleteScheduleWithId,
} = require("../controllers/schedule.controller");

const router = express.Router();

router.post("/create", authMiddleware(["SCHOOL"]), createSchedule);
router.get(
  "/class/:id",
  authMiddleware(["SCHOOL", "TEACHER","STUDENT"]),
  getScheduleWithClass,
);
router.patch("/update/:id", authMiddleware(["SCHOOL"]), updateScheduleWithId);
router.delete("/delete/:id", authMiddleware(["SCHOOL"]), deleteScheduleWithId);

module.exports = router;
