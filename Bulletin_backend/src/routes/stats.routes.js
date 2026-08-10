const express = require('express');
const router = express.Router();
const { getDashboardStats, getStudentPersonalStats, getTeacherSubjectStats } = require('../controllers/stats.controller.new');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Admin dashboard stats with semester filter
router.get('/dashboard', authMiddleware, roleMiddleware('admin', 'secretariat'), getDashboardStats);

// Student personal stats
router.get('/student/personal', authMiddleware, roleMiddleware('student'), getStudentPersonalStats);

// Teacher subject stats
router.get('/teacher/subjects', authMiddleware, roleMiddleware('teacher'), getTeacherSubjectStats);

module.exports = router;
