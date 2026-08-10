const express = require("express");
const router = express.Router();
const groupController = require("../controllers/group.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Routes accessible to admin, secretariat, teachers, and students (read-only)
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "secretariat", "teacher", "student"]),
  groupController.getAllGroups,
);
router.get(
  "/academic-years",
  authMiddleware,
  roleMiddleware(["admin", "secretariat", "teacher", "student"]),
  groupController.getAcademicYears,
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "secretariat", "teacher", "student"]),
  groupController.getGroupById,
);

// Routes reserved for admin (modifications)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  groupController.createGroup,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  groupController.updateGroup,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  groupController.deleteGroup,
);

module.exports = router;
