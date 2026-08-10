const express = require('express');
const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subject.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

// Lecture - Admin, Secrétariat et Enseignant
router.get('/', roleMiddleware('admin', 'secretariat', 'teacher'), getAllSubjects);
router.get('/:id', roleMiddleware('admin', 'secretariat', 'teacher'), getSubjectById);

// Modification - Admin et Secrétariat uniquement
router.post('/', roleMiddleware('admin', 'secretariat'), createSubject);
router.put('/:id', roleMiddleware('admin', 'secretariat'), updateSubject);
router.delete('/:id', roleMiddleware('admin', 'secretariat'), deleteSubject);

module.exports = router;
