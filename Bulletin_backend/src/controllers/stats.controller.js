const { Student, User, Grade, SemesterResult, AnnualResult, Semester, Absence } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.count();
    const totalTeachers = await User.count({ where: { role: 'teacher', active: true } });

    // Moyenne de la promotion (moyenne des AnnualResult uniques par étudiant)
    const annualResults = await AnnualResult.findAll({
      where: { average: { [Op.ne]: null } },
      attributes: ['studentId', 'average'],
      order: [['createdAt', 'DESC']],
    });
    // Prendre uniquement le dernier résultat par étudiant
    const uniqueAnnualResults = [];
    const seenStudents = new Set();
    for (const r of annualResults) {
      if (!seenStudents.has(r.studentId)) {
        seenStudents.add(r.studentId);
        uniqueAnnualResults.push(r);
      }
    }
    const promoAverage = uniqueAnnualResults.length > 0
      ? (uniqueAnnualResults.reduce((sum, r) => sum + parseFloat(r.average), 0) / uniqueAnnualResults.length).toFixed(2)
      : null;

    // Bulletins générés (nombre d'étudiants uniques ayant des SemesterResult)
    const semesterResultsAll = await SemesterResult.findAll({ attributes: ['studentId'] });
    const bulletinsGenerated = new Set(semesterResultsAll.map(sr => sr.studentId)).size;

    // Décisions jury (compter chaque étudiant une seule fois - dernier résultat)
    const allAnnualResults = await AnnualResult.findAll({
      attributes: ['studentId', 'decision'],
      order: [['createdAt', 'DESC']],
    });
    // Prendre uniquement la dernière décision par étudiant
    const uniqueDecisions = {};
    const seenDecisions = new Set();
    for (const r of allAnnualResults) {
      if (!seenDecisions.has(r.studentId)) {
        seenDecisions.add(r.studentId);
        uniqueDecisions[r.decision] = (uniqueDecisions[r.decision] || 0) + 1;
      }
    }
    const decisionMap = uniqueDecisions;

    // Absences totales
    const totalAbsences = await Absence.sum('hours') || 0;

    // Notes saisies ce mois
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const gradesThisMonth = await Grade.count({
      where: { dateRecorded: { [Op.gte]: oneMonthAgo } },
    });

    // Semestres validés (compter par étudiant unique)
    const allSemResults = await SemesterResult.findAll({
      attributes: ['studentId', 'isValidated'],
      order: [['createdAt', 'DESC']],
    });
    const uniqueSemResults = [];
    const seenSemStudents = new Set();
    for (const r of allSemResults) {
      if (!seenSemStudents.has(r.studentId)) {
        seenSemStudents.add(r.studentId);
        uniqueSemResults.push(r);
      }
    }
    const semestersValidated = uniqueSemResults.filter(r => r.isValidated).length;
    const semestersTotal = uniqueSemResults.length;

    // Dernier semestre
    const latestSemester = await Semester.findOne({ order: [['createdAt', 'DESC']] });

    // Résultats par semestre pour les moyennes
    const semesterStats = await Semester.findAll({
      include: [{
        model: SemesterResult,
        attributes: ['average', 'isValidated', 'totalCredits'],
      }],
    });

    const semesterAverages = {};
    for (const sem of semesterStats) {
      const results = sem.SemesterResults || [];
      if (results.length > 0) {
        const avg = results.reduce((s, r) => s + (parseFloat(r.average) || 0), 0) / results.length;
        semesterAverages[sem.code] = {
          average: avg.toFixed(2),
          validated: results.filter(r => r.isValidated).length,
          total: results.length,
        };
      }
    }

    // Activité récente (dernières notes saisies)
    const recentGrades = await Grade.findAll({
      order: [['dateRecorded', 'DESC']],
      limit: 5,
      include: [
        { model: Student, attributes: ['firstName', 'lastName', 'matricule'] },
      ],
    });

    const recentActivity = recentGrades.map(g => ({
      student: g.Student ? `${g.Student.firstName} ${g.Student.lastName}` : 'Inconnu',
      type: g.type,
      value: g.value,
      date: g.dateRecorded,
    }));

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        promoAverage,
        bulletinsGenerated,
        totalAbsences,
        gradesThisMonth,
        semestersValidated,
        semestersTotal,
        latestSemester: latestSemester ? { code: latestSemester.code, name: latestSemester.name } : null,
        semesterAverages,
        juryDecisions: decisionMap,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
