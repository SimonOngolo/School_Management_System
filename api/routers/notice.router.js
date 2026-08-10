const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  createNotice,
  getAllNotices,
  updateNoticewithId,
  deleteNoticewithId,
} = require("../controllers/notice.controller");

const router = express.Router();

// ✅ All Notice routes are secured via role-based authentication matrix
router.post("/create", authMiddleware(["SCHOOL", "TEACHER"]), createNotice);
router.get("/all", authMiddleware(["SCHOOL", "TEACHER", "STUDENT"]), getAllNotices);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL",]),
  updateNoticewithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "TEACHER"]),
  deleteNoticewithId,
);

module.exports = router;
