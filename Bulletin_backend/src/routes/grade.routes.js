const express = require('express');
const { getGradesByStudent, getGradeBySubject, upsertGrade, deleteGrade, recalculateAllForStudent, getTeacherSubjects } = require('../controllers/grade.controller');
const { Student } = require('../models');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.get('/student/:studentId', authMiddleware, getGradesByStudent);
router.get('/student/:studentId/subject/:subjectId', authMiddleware, getGradeBySubject);
router.post('/', authMiddleware, roleMiddleware('teacher', 'secretariat', 'admin'), upsertGrade);
router.delete('/:id', authMiddleware, roleMiddleware('teacher', 'secretariat', 'admin'), deleteGrade);

// Route pour recalculer toutes les notes (admin uniquement)
router.post('/recalculate-all', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  const transaction = await require('../models').sequelize.transaction();
  try {
    const students = await Student.findAll({ attributes: ['id'] });
    let count = 0;
    
    for (const student of students) {
      await recalculateAllForStudent(student.id, transaction);
      count++;
    }
    
    await transaction.commit();
    res.json({ success: true, message: `${count} étudiants recalculés avec succès` });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;
