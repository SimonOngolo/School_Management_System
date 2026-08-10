const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createClass,
  getAllClasses,
  updateClasswithId,
  deleteClasswithId,
  getSingleClass,
  getAttendeeClass,
  postAttendance,
} = require("../controllers/class.controller");

const router = express.Router();

router.post("/create", authMiddleware(["SCHOOL"]), createClass);
router.get("/all", authMiddleware(["SCHOOL", "TEACHER"]), getAllClasses);
router.get("/single/:id", authMiddleware(["SCHOOL"]), getSingleClass);
router.get("/attendee", authMiddleware(["TEACHER"]), getAttendeeClass);
router.post("/attendance", authMiddleware(["TEACHER"]), postAttendance);
router.patch("/update/:id", authMiddleware(["SCHOOL"]), updateClasswithId);
router.delete("/delete/:id", authMiddleware(["SCHOOL"]), deleteClasswithId);

module.exports = router;
