const express = require('express');
const {
  getAllSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester
} = require('../controllers/semester.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Tous les endpoints nécessitent d'être connecté + rôle admin ou secretariat
router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'secretariat']));

router.get('/', getAllSemesters);
router.get('/:id', getSemesterById);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.delete('/:id', deleteSemester);

module.exports = router;
