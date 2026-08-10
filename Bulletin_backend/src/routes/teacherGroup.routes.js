const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const {
  getGroupTeachers,
  getTeacherGroups,
  getMyGroups,
  assignTeacher,
  removeTeacher,
  getAllTeachers
} = require('../controllers/teacherGroup.controller');

// GET /api/groups/:groupId/teachers - Enseignants d'un groupe (admin, secretariat, teacher)
router.get('/groups/:groupId/teachers', authMiddleware, roleMiddleware('admin', 'secretariat', 'teacher'), getGroupTeachers);

// GET /api/teachers/:teacherId/groups - Groupes d'un enseignant spécifique (admin, secretariat, teacher)
router.get('/teachers/:teacherId/groups', authMiddleware, roleMiddleware('admin', 'secretariat', 'teacher'), getTeacherGroups);

// GET /api/my/groups - Groupes de l'enseignant connecté (pour l'enseignant lui-même)
router.get('/my/groups', authMiddleware, roleMiddleware('teacher'), getMyGroups);

// GET /api/teachers - Liste des enseignants (admin et secretariat uniquement)
router.get('/teachers', authMiddleware, roleMiddleware('admin', 'secretariat'), getAllTeachers);

// POST /api/teacher-groups - Affecter un enseignant à un groupe (admin uniquement)
router.post('/teacher-groups', authMiddleware, roleMiddleware('admin'), assignTeacher);

// DELETE /api/teacher-groups/:id - Retirer un enseignant d'un groupe (admin uniquement)
router.delete('/teacher-groups/:id', authMiddleware, roleMiddleware('admin'), removeTeacher);

module.exports = router;
