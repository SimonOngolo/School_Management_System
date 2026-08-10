const { Grade, Student, Subject, UE, Semester, SubjectResult, UEResult, SemesterResult, AnnualResult, sequelize } = require('../models');
const calculationService = require('../services/calculation.service');

// Récupérer toutes les notes d'un étudiant
const getGradesByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const grades = await Grade.findAll({
      where: { studentId },
      include: [{ model: Subject, attributes: ['name', 'coefficient', 'credits'] }]
    });
    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
};

// Récupérer les notes d'un étudiant pour une matière spécifique
const getGradeBySubject = async (req, res, next) => {
  try {
    const { studentId, subjectId } = req.params;
    const grades = await Grade.findAll({
      where: { studentId, subjectId }
    });
    
    const ccGrade = grades.find(g => g.type === 'CC');
    const examGrade = grades.find(g => g.type === 'EXAM');
    const rattrapageGrade = grades.find(g => g.type === 'RATTRAPAGE');
    
    let calculatedAverage = null;
    
    if (rattrapageGrade) {
      calculatedAverage = parseFloat(rattrapageGrade.value);
    } else if (ccGrade && examGrade) {
      calculatedAverage = (parseFloat(ccGrade.value) * 0.4) + (parseFloat(examGrade.value) * 0.6);
    } else if (ccGrade) {
      calculatedAverage = parseFloat(ccGrade.value);
    } else if (examGrade) {
      calculatedAverage = parseFloat(examGrade.value);
    }
    
    res.json({ 
      success: true, 
      data: { 
        grades, 
        calculatedAverage: calculatedAverage !== null ? calculatedAverage.toFixed(2) : null
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Ajouter ou modifier une note
const upsertGrade = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { studentId, subjectId, type, value } = req.body;
    
    const existingGrade = await Grade.findOne({
      where: { studentId, subjectId, type },
      transaction
    });
    
    let grade;
    if (existingGrade) {
      await existingGrade.update({ value, dateRecorded: new Date() }, { transaction });
      grade = existingGrade;
    } else {
      grade = await Grade.create({ studentId, subjectId, type, value }, { transaction });
    }
    
    await recalculateAllForStudent(studentId, transaction);
    
    await transaction.commit();
    
    res.json({ 
      success: true, 
      message: 'Note enregistrée et calculs mis à jour',
      data: grade 
    });
  } catch (error) {
    // Annuler la transaction en cas d'erreur (seulement si pas déjà commit/rollback)
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Supprimer une note
const deleteGrade = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const grade = await Grade.findByPk(id);
    
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Note non trouvée' });
    }
    
    await grade.destroy({ transaction });
    await recalculateAllForStudent(grade.studentId, transaction);
    
    await transaction.commit();
    
    res.json({ success: true, message: 'Note supprimée et calculs mis à jour' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Fonction de recalcul complet
// Si transaction externe passée, ne pas commit/rollback (l'appelant gère)
async function recalculateAllForStudent(studentId, externalTransaction) {
const isExternalTransaction = !!externalTransaction;
const transaction = externalTransaction || await sequelize.transaction();

try {
  const allGrades = await Grade.findAll({
    where: { studentId },
    include: [{ model: Subject, include: [{ model: UE, include: [{ model: Semester }] }] }],
    transaction
  });
  
  const gradesBySubject = {};
  for (const grade of allGrades) {
    const subjectId = grade.subjectId;
    if (!gradesBySubject[subjectId]) {
      gradesBySubject[subjectId] = { cc: null, exam: null, rattrapage: null, subject: grade.Subject };
    }
    gradesBySubject[subjectId][grade.type.toLowerCase()] = grade.value;
  }
  
  for (const [subjectId, data] of Object.entries(gradesBySubject)) {
    const average = calculationService.calculateSubjectAverage(
      data.cc, data.exam, data.rattrapage, data.subject.evaluationMode
    );

    // Find existing or create/update explicitly
    const existingSubjectResult = await SubjectResult.findOne({
      where: { studentId, subjectId: parseInt(subjectId) },
      transaction
    });
    
    if (existingSubjectResult) {
      await existingSubjectResult.update({
        average,
        rattrapageUsed: data.rattrapage !== null,
        updatedAt: new Date()
      }, { transaction });
      console.log(`SubjectResult mis à jour: studentId=${studentId}, subjectId=${subjectId}, average=${average}`);
    } else {
      await SubjectResult.create({
        studentId,
        subjectId: parseInt(subjectId),
        average,
        rattrapageUsed: data.rattrapage !== null
      }, { transaction });
      console.log(`SubjectResult créé: studentId=${studentId}, subjectId=${subjectId}, average=${average}`);
    }
  }
  
  const parseStoredAverage = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(String(val));
    return Number.isNaN(n) ? null : n;
  };

  const allSubjectRows = await SubjectResult.findAll({
    where: { studentId },
    include: [
      {
        model: Subject,
        attributes: ['id', 'coefficient', 'credits', 'ueId'],
        include: [{ model: UE, attributes: ['id', 'semesterId'] }]
      }
    ],
    transaction
  });

  const semesterIdsToProcess = new Set();
  for (const row of allSubjectRows) {
    const semId = row.Subject?.UE?.semesterId;
    if (semId != null) semesterIdsToProcess.add(semId);
  }

  const semesters = await Semester.findAll({ transaction });
  const semesterDetails = {};
  for (const sem of semesters) {
    semesterDetails[sem.id] = sem;
  }

  const semesterResults = [];
  for (const semesterId of semesterIdsToProcess) {
    const allUEsInSemester = await UE.findAll({
      where: { semesterId },
      include: [{ model: Subject, attributes: ['id', 'credits', 'coefficient'] }],
      transaction
    });

    const requiredSemesterCredits = allUEsInSemester.reduce(
      (sum, ue) =>
        sum + (ue.Subjects || []).reduce((s, sub) => s + (parseFloat(sub.credits) || 0), 0),
      0
    );

    const flatSemester = [];
    for (const ue of allUEsInSemester) {
      for (const sub of ue.Subjects || []) {
        const sr = allSubjectRows.find((r) => r.subjectId === sub.id);
        const avg = parseStoredAverage(sr?.average);
        const coef = parseFloat(sub.coefficient);
        if (avg != null && !Number.isNaN(coef) && coef > 0) {
          flatSemester.push({ average: avg, coefficient: coef });
        }
      }
    }
    const semesterAverage = calculationService.calculateUEAverage(flatSemester);

    let totalCreditsAcquired = 0;
    for (const ue of allUEsInSemester) {
      const ueFlat = [];
      for (const sub of ue.Subjects || []) {
        const sr = allSubjectRows.find((r) => r.subjectId === sub.id);
        const avg = parseStoredAverage(sr?.average);
        const coef = parseFloat(sub.coefficient);
        if (avg != null && !Number.isNaN(coef) && coef > 0) {
          ueFlat.push({ average: avg, coefficient: coef });
        }
      }
      const ueAverage = calculationService.calculateUEAverage(ueFlat);
      const ueTotalCredits =
        (ue.Subjects || []).reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0) || 0;

      const validation = calculationService.validateUE(ueAverage, semesterAverage, ueTotalCredits);

      const existingUEResult = await UEResult.findOne({
        where: { studentId, ueId: ue.id },
        transaction
      });
      if (existingUEResult) {
        await existingUEResult.update({
          average: ueAverage,
          creditsAcquired: validation.creditsAcquired,
          isCompensated: validation.isCompensated,
          isValidated: validation.isValidated,
          updatedAt: new Date()
        }, { transaction });
      } else {
        await UEResult.create({
          studentId,
          ueId: ue.id,
          average: ueAverage,
          creditsAcquired: validation.creditsAcquired,
          isCompensated: validation.isCompensated,
          isValidated: validation.isValidated
        }, { transaction });
      }

      totalCreditsAcquired += validation.creditsAcquired;
    }

    const isValidated = calculationService.validateSemester(totalCreditsAcquired, requiredSemesterCredits);

    const existingSemesterResult = await SemesterResult.findOne({
      where: { studentId, semesterId },
      transaction
    });
    if (existingSemesterResult) {
      await existingSemesterResult.update({
        average: semesterAverage,
        totalCredits: totalCreditsAcquired,
        isValidated,
        updatedAt: new Date()
      }, { transaction });
    } else {
      await SemesterResult.create({
        studentId,
        semesterId,
        average: semesterAverage,
        totalCredits: totalCreditsAcquired,
        isValidated
      }, { transaction });
    }

    semesterResults.push({
      semesterId,
      average: semesterAverage,
      isValidated,
      totalCredits: totalCreditsAcquired
    });
  }
  
  const s5Result = semesterResults.find(s => semesterDetails[s.semesterId]?.code === 'S5');
  const s6Result = semesterResults.find(s => semesterDetails[s.semesterId]?.code === 'S6');
  
  const annualAverage = calculationService.calculateAnnualAverage(
    s5Result?.average || null,
    s6Result?.average || null
  );
  
  const soutenanceUE = await UE.findOne({ where: { code: 'UE6-2' }, transaction });
  const soutenanceResult = soutenanceUE ? await UEResult.findOne({ 
    where: { studentId, ueId: soutenanceUE.id },
    transaction
  }) : null;
  const hasSoutenance = !!soutenanceUE; // Il y a une UE de soutenance dans le système
  const ue6_2Validated = soutenanceResult?.isValidated || false; // L'étudiant l'a validée
  
  const decision = calculationService.decideJury(
    s5Result?.isValidated || false,
    s6Result?.isValidated || false,
    s6Result?.totalCredits || 0,
    hasSoutenance,
    ue6_2Validated
  );
  
  const mention = calculationService.calculateMention(annualAverage);
  
  const existingAnnualResult = await AnnualResult.findOne({
    where: { studentId, academicYear: '2024-2025' },
    transaction
  });
  if (existingAnnualResult) {
    await existingAnnualResult.update({
      average: annualAverage,
      totalCredits: (s5Result?.totalCredits || 0) + (s6Result?.totalCredits || 0),
      decision,
      mention,
      updatedAt: new Date()
    }, { transaction });
  } else {
    await AnnualResult.create({
      studentId,
      academicYear: '2024-2025',
      average: annualAverage,
      totalCredits: (s5Result?.totalCredits || 0) + (s6Result?.totalCredits || 0),
      decision,
    }, { transaction });
  }

  // Commit seulement si transaction créée localement (pas externe)
  if (!isExternalTransaction) {
    await transaction.commit();
  }

  // Retourner les résultats calculés (pas de res.json ici, c'est une fonction helper)
  return {
    success: true,
    annualAverage: parseFloat(annualAverage).toFixed(2),
    decision,
    totalCredits: (s5Result?.totalCredits || 0) + (s6Result?.totalCredits || 0),
  };
} catch (error) {
  // Annuler la transaction en cas d'erreur (seulement si pas externe et pas déjà finished)
  if (!isExternalTransaction && transaction && !transaction.finished) {
    await transaction.rollback();
  }
  throw error;
}
};

// Get subjects for teacher - restricted to assigned subjects only
const getTeacherSubjects = async (req, res, next) => {
try {
  const teacherId = req.user.id;

  // Get subjects assigned to this teacher
  const teacherSubjects = await TeacherSubject.findAll({
    where: { teacherId },
    include: [{
      model: Subject,
      attributes: ['id', 'name', 'code', 'coefficient', 'credit'],
    }],
  });

  const subjects = teacherSubjects
    .filter(ts => ts.Subject)
    .map(ts => ({
      id: ts.Subject.id,
      name: ts.Subject.name,
      code: ts.Subject.code,
      coefficient: ts.Subject.coefficient,
      credit: ts.Subject.credit,
    }));

  if (subjects.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: "Aucune matière assignée. Contactez l'administrateur pour être assigné à des matières."
    });
  }

  res.json({ success: true, data: subjects });
} catch (error) {
  next(error);
}
};

module.exports = {
getGradesByStudent,
getGradeBySubject,
upsertGrade,
deleteGrade,
recalculateAllForStudent,
getTeacherSubjects,
};
