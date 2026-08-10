const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  newExamination,
  getAllExaminations,
  getExaminationsByClass,
  updateExaminationWithId,
  deleteExaminationWithId,
} = require("../controllers/examinations.controller");

const router = express.Router();

router.post("/create", authMiddleware(["SCHOOL"]), newExamination);
router.get("/all", authMiddleware(["SCHOOL", "TEACHER","STUDENT"]), getAllExaminations);
router.get(
  "/class/:id",
  authMiddleware(["SCHOOL", "TEACHER", "STUDENT"]),
  getExaminationsByClass,
);
router.put("/update/:id", authMiddleware(["SCHOOL"]), updateExaminationWithId);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL"]),
  deleteExaminationWithId,
);



module.exports = router;
