const { Student, User, Grade, SemesterResult, AnnualResult, Semester, Absence, Subject, TeacherGroup, TeacherSubject, Group, UE, GroupUE } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper: Calculate absence penalty (0.01 point per hour)
const calculateAbsencePenalty = (hours) => hours * 0.01;

const getDashboardStats = async (req, res, next) => {
  try {
    const { semester } = req.query;
    const totalStudents = await Student.count();
    const totalTeachers = await User.count({ where: { role: 'teacher', active: true } });

    // Calculate promo average
    let promoAverage = null;
    let juryDecisions = {};

    if (semester === 'S5' || semester === 'S6') {
      const sem = await Semester.findOne({ where: { code: semester } });
      if (sem) {
        const results = await SemesterResult.findAll({
          where: { semesterId: sem.id, average: { [Op.ne]: null } },
          attributes: ['average', 'isValidated', 'studentId'],
          order: [['createdAt', 'DESC']],
        });
        const uniqueResults = [];
        const seen = new Set();
        for (const r of results) {
          if (!seen.has(r.studentId)) {
            seen.add(r.studentId);
            uniqueResults.push(parseFloat(r.average));
          }
        }
        promoAverage = uniqueResults.length > 0
          ? (uniqueResults.reduce((a, b) => a + b, 0) / uniqueResults.length).toFixed(2)
          : null;
        const validated = uniqueResults.filter((_, i) => results[i].isValidated).length;
        juryDecisions = { VALIDATED: validated, NOT_VALIDATED: uniqueResults.length - validated };
      }
    } else {
      const annual = await AnnualResult.findAll({
        where: { average: { [Op.ne]: null } },
        attributes: ['studentId', 'average', 'decision'],
        order: [['createdAt', 'DESC']],
      });
      const unique = [];
      const seen = new Set();
      for (const r of annual) {
        if (!seen.has(r.studentId)) {
          seen.add(r.studentId);
          unique.push(r);
        }
      }
      promoAverage = unique.length > 0
        ? (unique.reduce((s, r) => s + parseFloat(r.average), 0) / unique.length).toFixed(2)
        : null;
      juryDecisions = unique.reduce((acc, r) => {
        acc[r.decision] = (acc[r.decision] || 0) + 1;
        return acc;
      }, {});
    }

    // Missing grades (simplified: subjects × students × 2 - actual grades)
    const subjectCount = await Subject.count();
    const allGrades = await Grade.count();
    const expectedGrades = subjectCount * totalStudents * 2;
    const missingGradesCount = Math.max(0, expectedGrades - allGrades);

    // Out of range grades
    const outOfRangeGradesCount = await Grade.count({ where: { value: { [Op.gt]: 20 } } });

    // Top 5 absences
    const topAbs = await Absence.findAll({
      attributes: ['studentId', [sequelize.fn('SUM', sequelize.col('hours')), 'total']],
      group: ['studentId'],
      order: [[sequelize.fn('SUM', sequelize.col('hours')), 'DESC']],
      limit: 5,
      include: [{ model: Student, attributes: ['firstName', 'lastName'] }],
    });

    const topAbsences = topAbs.map(a => {
      const hours = parseInt(a.getDataValue('total')) || 0;
      return {
        studentId: a.studentId,
        studentName: a.Student ? `${a.Student.firstName} ${a.Student.lastName}` : 'Inconnu',
        totalHours: hours,
        penalty: calculateAbsencePenalty(hours),
      };
    });

    const totalAbsences = await Absence.sum('hours') || 0;

    // Recent activity with audit
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recent = await Grade.findAll({
      where: { dateRecorded: { [Op.gte]: oneMonthAgo } },
      order: [['dateRecorded', 'DESC']],
      limit: 5,
      include: [
        { model: Student, attributes: ['firstName', 'lastName'] },
        { model: User, as: 'EnteredBy', attributes: ['firstName', 'lastName'] },
      ],
    });

    const recentActivity = recent.map(g => ({
      student: g.Student ? `${g.Student.firstName} ${g.Student.lastName}` : 'Inconnu',
      type: g.type,
      value: g.value,
      date: g.dateRecorded,
      enteredBy: g.EnteredBy ? `${g.EnteredBy.firstName} ${g.EnteredBy.lastName}` : null,
    }));

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        promoAverage,
        totalAbsences,
        missingGradesCount,
        outOfRangeGradesCount,
        topAbsences,
        juryDecisions,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getStudentPersonalStats = async (req, res, next) => {
  try {
    const studentId = req.user?.studentId || req.params.studentId;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID required' });

    const grades = await Grade.findAll({
      where: { studentId },
      include: [
        { model: Subject, attributes: ['name'] },
        { model: Semester, attributes: ['code'] },
      ],
      order: [['dateRecorded', 'DESC']],
    });

    const myGrades = grades.map(g => ({
      subject: g.Subject?.name || 'Inconnu',
      type: g.type,
      value: g.value,
      semester: g.Semester?.code || '—',
    }));

    const annual = await AnnualResult.findOne({
      where: { studentId },
      order: [['createdAt', 'DESC']],
    });
    const myAverage = annual?.average ? parseFloat(annual.average).toFixed(2) : null;

    const allAnnual = await AnnualResult.findAll({
      where: { average: { [Op.ne]: null } },
      attributes: ['studentId', 'average'],
      order: [['average', 'DESC']],
    });
    const myRank = allAnnual.findIndex(r => r.studentId === parseInt(studentId)) + 1;
    const totalStudents = await Student.count();

    const absences = await Absence.findAll({ where: { studentId } });
    const myAbsences = absences.reduce((s, a) => s + (a.hours || 0), 0);
    const myAbsencePenalty = calculateAbsencePenalty(myAbsences);

    res.json({
      success: true,
      data: { myGrades, myAverage, myRank, totalStudents, myAbsences, myAbsencePenalty },
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherSubjectStats = async (req, res, next) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return res.status(400).json({ success: false, message: 'Teacher ID required' });

    // Récupérer l'enseignant avec ses matières via l'association Many-to-Many
    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' },
      include: [{
        model: Subject,
        as: 'TeacherSubjects',
        through: { attributes: [] } // Ne pas inclure les colonnes de la table de jointure
      }]
    });

    const subjects = teacher?.TeacherSubjects || [];
    
    if (subjects.length === 0) {
      return res.json({
        success: true,
        data: {
          subjects: [],
          message: "Aucune matière assignée. Contactez l'administration pour être assigné à des matières."
        }
      });
    }

    const subjectsWithStats = [];
    let totalStudents = 0;
    for (const subj of subjects) {
      const grades = await Grade.findAll({
        where: { subjectId: subj.id },
        include: [{ model: Student }],
      });
      const uniqueStudents = new Set(grades.map(g => g.studentId)).size;
      const avg = grades.length > 0 ? (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(2) : '—';
      totalStudents += uniqueStudents;
      subjectsWithStats.push({ id: subj.id, name: subj.name, coefficient: subj.coefficient, studentCount: uniqueStudents, averageGrade: avg });
    }

    const tGroups = await TeacherGroup.findAll({
      where: { teacherId },
      include: [{ model: Group, attributes: ['name'] }],
    });
    const groups = tGroups.map(tg => tg.Group?.name).filter(Boolean);

    res.json({ success: true, data: { subjects: subjectsWithStats, groups, totalStudents } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getStudentPersonalStats, getTeacherSubjectStats };
