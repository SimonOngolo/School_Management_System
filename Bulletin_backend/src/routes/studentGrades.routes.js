const express = require('express');
const { getMyGrades, getMyBulletin } = require('../controllers/studentGrades.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

// Toutes les routes nécessitent d'être connecté en tant qu'étudiant
router.use(authMiddleware, roleMiddleware('student'));

// GET /api/student/grades - Voir mes notes
router.get('/grades', getMyGrades);

// GET /api/student/bulletin - Voir mon bulletin
router.get('/bulletin', getMyBulletin);

module.exports = router;
