const express = require("express");
const authMiddleware = require("../auth/auth");
const upload = require("../upload"); // Import your multer configuration
const {
  registerStudent,
  getStudentsWithQuery,
  loginStudent,
  updateStudent,
  deleteStudentWithId,
  getStudentOwnData,
  getStudentWithId,
} = require("../controllers/student.controller");

const router = express.Router();

// Add upload.single("image") to handle student photo uploads
router.post(
  "/register",
  authMiddleware(["SCHOOL"]),
  upload.single("image"),
  registerStudent,
);

router.get(
  "/fetch-width-query",
  authMiddleware(["SCHOOL", "TEACHER"]),
  getStudentsWithQuery,
);

router.post("/login", loginStudent);

// Add upload.single("image") here as well for updates containing a new photo
router.put(
  "/update/:id",
  authMiddleware(["SCHOOL"]),
  upload.single("image"),
  updateStudent,
);

router.get(
  "/fetch-single",
  authMiddleware(["STUDENT", "SCHOOL"]),
  getStudentOwnData,
);
router.get("/fetch/:id", authMiddleware(["SCHOOL"]), getStudentWithId);
router.delete("/delete/:id", authMiddleware(["SCHOOL"]), deleteStudentWithId);

router.get("/test-route", (req, res) => {
  res.json({ message: "Router is active!" });
});

module.exports = router;
