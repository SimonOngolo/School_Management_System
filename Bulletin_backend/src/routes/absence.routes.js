const express = require('express');
const { getAbsencesByStudent, upsertAbsence, deleteAbsence } = require('../controllers/absence.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/student/:studentId', authMiddleware, getAbsencesByStudent);
router.post('/', authMiddleware, roleMiddleware('secretariat', 'admin'), upsertAbsence);
router.delete('/:id', authMiddleware, roleMiddleware('secretariat', 'admin'), deleteAbsence);

module.exports = router;
