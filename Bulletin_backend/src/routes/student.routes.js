const express = require('express');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createMissingStudentAccounts
} = require('../controllers/student.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Routes publiques (authentification requise mais pas de rôle spécifique)
router.get('/', authMiddleware, getAllStudents);
router.get('/:id', authMiddleware, getStudentById);

// Routes protégées (admin et secrétariat uniquement)
router.post('/', authMiddleware, roleMiddleware('admin', 'secretariat','student'), createStudent);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'secretariat'), updateStudent);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteStudent);

// Route admin pour créer les comptes utilisateurs des étudiants existants
router.post('/create-accounts', authMiddleware, roleMiddleware('admin'), createMissingStudentAccounts);

module.exports = router;
