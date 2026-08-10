const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createSubject,
  getAllSubjects,
  updateSubjectwithId,
  deleteSubjectwithId,
} = require("../controllers/subject.controller");

const router = express.Router();

// ✅ Protect the create route with authMiddleware
router.post("/create", authMiddleware(["SCHOOL"]), createSubject);
router.get("/all", authMiddleware(["SCHOOL", "TEACHER"]), getAllSubjects);
router.patch("/update/:id", authMiddleware(["SCHOOL"]), updateSubjectwithId); // AUTHENTICATED USER FOR UPDATE
router.delete("/delete/:id", authMiddleware(["SCHOOL"]), deleteSubjectwithId);

module.exports = router;
