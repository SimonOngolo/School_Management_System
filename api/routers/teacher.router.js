const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  registerTeacher,
  getTeachersWithQuery,
  loginTeacher,
  updateTeacher,
  deleteTeacherWithId,
  getTeacherOwnData,
  getTeacherWithId,
} = require("../controllers/teacher.controller");

const router = express.Router();

router.post("/register", authMiddleware(["SCHOOL"]), registerTeacher);
router.get(
  "/fetch-width-query",
  authMiddleware(["SCHOOL"]),
  getTeachersWithQuery,
);
router.post("/login", loginTeacher);
router.put("/update/:id", authMiddleware(["SCHOOL"]), updateTeacher);
router.get("/fetch-single", authMiddleware(["TEACHER"]), getTeacherOwnData);
router.get("/fetch/:id", authMiddleware(["SCHOOL"]), getTeacherWithId);
router.delete("/delete/:id", authMiddleware(["SCHOOL"]), deleteTeacherWithId);

module.exports = router;
