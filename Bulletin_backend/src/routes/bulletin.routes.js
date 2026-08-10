const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');

// Importer le contrôleur
const {
  listSemesters,
  getBulletinBySemesterId,
  getBulletinBySemesterCode,
  getBulletinAnnuelByYear,
  getLatestBulletin
} = require('../controllers/bulletin.controller');

const router = express.Router();

// Vérifier que les fonctions existent
console.log('✅ Bulletin routes chargées');
console.log('  - listSemesters:', typeof listSemesters);
console.log('  - getBulletinBySemesterId:', typeof getBulletinBySemesterId);
console.log('  - getBulletinBySemesterCode:', typeof getBulletinBySemesterCode);
console.log('  - getBulletinAnnuelByYear:', typeof getBulletinAnnuelByYear);
console.log('  - getLatestBulletin:', typeof getLatestBulletin);

// Routes
router.get('/semesters', authMiddleware, listSemesters);
router.get('/student/:id/semester/:semesterId', authMiddleware, getBulletinBySemesterId);
router.get('/student/:id/semester/code/:semesterCode', authMiddleware, getBulletinBySemesterCode);
router.get('/student/:id/annual/:year', authMiddleware, getBulletinAnnuelByYear);
router.get('/student/:id/latest', authMiddleware, getLatestBulletin);

// Routes de compatibilité
router.get('/student/:id/s5', authMiddleware, (req, res, next) => {
  req.params.semesterCode = 'S5';
  getBulletinBySemesterCode(req, res, next);
});
router.get('/student/:id/s6', authMiddleware, (req, res, next) => {
  req.params.semesterCode = 'S6';
  getBulletinBySemesterCode(req, res, next);
});
router.get('/student/:id/annual', authMiddleware, (req, res, next) => {
  req.params.year = '2024-2025';
  getBulletinAnnuelByYear(req, res, next);
});

module.exports = router;
