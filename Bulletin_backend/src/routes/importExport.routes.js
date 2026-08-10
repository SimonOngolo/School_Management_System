const express = require('express');
const { importGradesFromExcel, importStudentsFromExcel, exportJuryDecisions, exportSemesterGrades, upload } = require('../controllers/importExport.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/grades', authMiddleware, roleMiddleware('secretariat', 'admin'), upload.single('file'), importGradesFromExcel);
router.post('/students', authMiddleware, roleMiddleware('admin'), upload.single('file'), importStudentsFromExcel);
router.get('/jury', authMiddleware, roleMiddleware('secretariat', 'admin'), exportJuryDecisions);
router.get('/semester/:semesterId', authMiddleware, roleMiddleware('secretariat', 'admin'), exportSemesterGrades);

module.exports = router;
