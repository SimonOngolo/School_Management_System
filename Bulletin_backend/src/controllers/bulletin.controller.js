const { Op } = require('sequelize');
const { Student, Group, Semester, UE, Subject, SubjectResult, UEResult, SemesterResult, AnnualResult, Absence } = require('../models');
const pdfGenerator = require('../utils/pdfGenerator');

// Liste des semestres disponibles
const listSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.findAll({
      attributes: ['id', 'name', 'code', 'academicYear', 'totalCredits']
    });
    res.json({ success: true, data: semesters });
  } catch (error) {
    next(error);
  }
};

// Générer bulletin complet par ID de semestre
const getBulletinBySemesterId = async (req, res, next) => {
  try {
    const { id, semesterId } = req.params;
    const requestedGroupId = req.query.groupId;
    
    const student = await Student.findByPk(id, { include: [{ model: Group }] });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }

    const groupId = requestedGroupId || student.groupId || null;
    
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semestre non trouvé' });
    }
    
    const semesterResult = await SemesterResult.findOne({
      where: { studentId: id, semesterId: semester.id }
    });
    
    const ues = await UE.findAll({
      where: { semesterId: semester.id },
      include: [{ model: Subject }]
    });
    
    const ueResults = await UEResult.findAll({
      where: { studentId: id, ueId: ues.map(u => u.id) }
    });
    
    const subjectResults = await SubjectResult.findAll({
      where: { studentId: id },
      include: [{ model: Subject }]
    });

    const semesterSubjectIdSet = new Set(ues.flatMap((u) => (u.Subjects || []).map((s) => s.id)));
    const subjectResultBySubject = new Map();
    for (const sr of subjectResults) {
      if (!semesterSubjectIdSet.has(sr.subjectId)) continue;
      const prev = subjectResultBySubject.get(sr.subjectId);
      if (!prev || (sr.id != null && prev.id != null && sr.id > prev.id)) {
        subjectResultBySubject.set(sr.subjectId, sr);
      }
    }
    const subjectResultsForSemester = [...subjectResultBySubject.values()];

    // Calcul des statistiques de classe (uniquement pour les étudiants du même semestre)
    // Récupérer les étudiants qui ont des résultats pour ce semestre
    const semesterResultsAll = await SemesterResult.findAll({
      where: { semesterId: semester.id },
      attributes: ['studentId']
    });
    // Éliminer les doublons avec Set
    let semesterStudentIds = [...new Set(semesterResultsAll.map(sr => sr.studentId))];

    // Filtrage par groupe si défini
    if (groupId) {
      const groupStudents = await Student.findAll({
        where: { id: semesterStudentIds, groupId },
        attributes: ['id']
      });
      semesterStudentIds = groupStudents.map(s => s.id);
    }
    
    const allSubjectResults =
      semesterStudentIds.length > 0
        ? await SubjectResult.findAll({
            where: { studentId: { [Op.in]: semesterStudentIds } }
          })
        : [];

    const toNum = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    const classAverages = {};
    const allAveragesBySubject = {};

    for (const ue of ues) {
      for (const subject of ue.Subjects) {
        const byStudent = new Map();
        for (const sr of allSubjectResults) {
          if (sr.subjectId !== subject.id) continue;
          const a = toNum(sr.average);
          if (a === null) continue;
          const prev = byStudent.get(sr.studentId);
          if (!prev || (sr.id != null && prev.srId != null && sr.id > prev.srId)) {
            byStudent.set(sr.studentId, { srId: sr.id, _num: a });
          }
        }
        const avs = [...byStudent.values()].map((r) => r._num);
        if (avs.length > 0) {
          classAverages[subject.id] = avs.reduce((x, y) => x + y, 0) / avs.length;
          allAveragesBySubject[subject.id] = avs;
        }
      }
    }
    
    // Calcul des rangs (position de l'étudiant parmi ceux du même semestre)
    const ranks = {};
    for (const ue of ues) {
      for (const subject of ue.Subjects) {
        const subjectResult = subjectResultsForSemester.find((sr) => sr.subjectId === subject.id);
        const studentAvg = toNum(subjectResult?.average);
        if (studentAvg !== null && allAveragesBySubject[subject.id]) {
          // Meilleure méthode: compter ceux qui sont strictement au-dessus + 1
          const allAvgs = allAveragesBySubject[subject.id];
          const rank = allAvgs.filter(avg => avg > studentAvg).length + 1;
          ranks[subject.id] = rank;
        }
      }
    }
    
    const absences = await Absence.findAll({
      where: { studentId: id, subjectId: ues.flatMap(u => u.Subjects.map(s => s.id)) }
    });
    
    const absenceMap = {};
    for (const absence of absences) {
      absenceMap[absence.subjectId] = absence.hours;
    }
    
    const totalAbsences = absences.reduce((sum, a) => sum + parseFloat(a.hours), 0);
    
    // Calculer la moyenne de classe au semestre et le rang de l'étudiant
    const allSemesterResults = await SemesterResult.findAll({
      where: { semesterId: semester.id, studentId: semesterStudentIds }
    });

    // Un seul SemesterResult par étudiant (évite rang aberrant si doublons en base)
    const byStudent = new Map();
    for (const r of allSemesterResults) {
      const prev = byStudent.get(r.studentId);
      if (!prev || (r.id != null && prev.id != null && r.id > prev.id)) {
        byStudent.set(r.studentId, r);
      }
    }
    const uniqueSemesterResults = [...byStudent.values()];

    const withValidSemesterAvg = uniqueSemesterResults.filter((r) => toNum(r.average) !== null);

    const semesterClassAverage =
      withValidSemesterAvg.length > 0
        ? withValidSemesterAvg.reduce((sum, r) => sum + toNum(r.average), 0) / withValidSemesterAvg.length
        : null;

    const allSemesterAverages = withValidSemesterAvg.map((r) => toNum(r.average));
    const studentSemesterAvg = semesterResult ? toNum(semesterResult.average) : null;
    const semesterRank =
      studentSemesterAvg !== null && !Number.isNaN(studentSemesterAvg)
        ? allSemesterAverages.filter((avg) => avg > studentSemesterAvg).length + 1
        : null;

    // Effectif pour le rang : étudiants avec une moyenne de semestre connue (même base que le rang)
    const totalStudents = withValidSemesterAvg.length;
    
    const allStudentsData = {
      classAverages,
      ranks,
      absences: absenceMap,
      totalAbsences,
      semesterClassAverage,
      semesterRank,
      totalStudents
    };
    
    const documentRef = `BULL-${semester.code}-${student.matricule}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const verifyBaseUrl = process.env.BULLETIN_VERIFY_BASE_URL || '';

    const pdfBuffer = await pdfGenerator.generateBulletin(
      student,
      semester,
      semesterResult,
      ues,
      ueResults,
      subjectResultsForSemester,
      allStudentsData,
      { documentRef, verifyBaseUrl }
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin_${semester.code}_${student.matricule}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// Générer bulletin par code
const getBulletinBySemesterCode = async (req, res, next) => {
  try {
    const { id, semesterCode } = req.params;
    const semester = await Semester.findOne({ where: { code: semesterCode.toUpperCase() } });
    if (!semester) {
      return res.status(404).json({ success: false, message: `Semestre ${semesterCode} non trouvé` });
    }
    req.params.semesterId = semester.id;
    return getBulletinBySemesterId(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Dernier bulletin
const getLatestBulletin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const latestResult = await SemesterResult.findOne({
      where: { studentId: id },
      order: [['createdAt', 'DESC']]
    });
    if (!latestResult) {
      return res.status(404).json({ success: false, message: 'Aucun bulletin trouvé' });
    }
    req.params.semesterId = latestResult.semesterId;
    return getBulletinBySemesterId(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Bulletin annuel complet
const getBulletinAnnuelByYear = async (req, res, next) => {
  try {
    const { id, year } = req.params;
    const requestedGroupId = req.query.groupId;
    
    const student = await Student.findByPk(id, { include: [{ model: Group }] });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }

    const groupId = requestedGroupId || student.groupId || null;
    
    const annualResult = await AnnualResult.findOne({
      where: { studentId: id, academicYear: year }
    });
    
    if (!annualResult) {
      return res.status(404).json({ success: false, message: `Résultat annuel pour ${year} non trouvé` });
    }
    
    const semesters = await Semester.findAll({ where: { academicYear: year } });
    const semester5 = semesters.find(s => s.code === 'S5');
    const semester6 = semesters.find(s => s.code === 'S6');
    
    const semester5Result = await SemesterResult.findOne({
      where: { studentId: id, semesterId: semester5?.id }
    });
    const semester6Result = await SemesterResult.findOne({
      where: { studentId: id, semesterId: semester6?.id }
    });
    
    // Récupérer les UE pour chaque semestre
    const uesS5 = await UE.findAll({
      where: { semesterId: semester5?.id },
      include: [{ model: Subject }]
    });
    const uesS6 = await UE.findAll({
      where: { semesterId: semester6?.id },
      include: [{ model: Subject }]
    });
    
    const ueResultsS5 = await UEResult.findAll({
      where: { studentId: id, ueId: uesS5.map(u => u.id) }
    });
    const ueResultsS6 = await UEResult.findAll({
      where: { studentId: id, ueId: uesS6.map(u => u.id) }
    });
    
    // Calcul des moyennes de classe
    let groupStudentIds = null;
    if (groupId) {
      const groupStudents = await Student.findAll({ where: { groupId }, attributes: ['id'] });
      groupStudentIds = groupStudents.map(s => s.id);
    }

    const allSemesterResults = await SemesterResult.findAll(
      groupStudentIds ? { where: { studentId: groupStudentIds } } : {}
    );
    const s5Averages = allSemesterResults
      .filter(r => r.semesterId === semester5?.id && r.average !== null)
      .map(r => parseFloat(r.average));
    const s6Averages = allSemesterResults
      .filter(r => r.semesterId === semester6?.id && r.average !== null)
      .map(r => parseFloat(r.average));
    
    const s5ClassAvg = s5Averages.length > 0 ? s5Averages.reduce((a, b) => a + b, 0) / s5Averages.length : null;
    const s6ClassAvg = s6Averages.length > 0 ? s6Averages.reduce((a, b) => a + b, 0) / s6Averages.length : null;
    
    const s5Rank = s5Averages.length > 0 && semester5Result?.average ? 
      s5Averages.filter(a => a > parseFloat(semester5Result.average)).length + 1 : null;
    const s6Rank = s6Averages.length > 0 && semester6Result?.average ? 
      s6Averages.filter(a => a > parseFloat(semester6Result.average)).length + 1 : null;
    
    // Préparer les données UE
    const uesDataS5 = uesS5.map(ue => {
      const result = ueResultsS5.find(r => r.ueId === ue.id);
      const totalCredits = ue.Subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
      return {
        name: ue.name,
        average: result?.average,
        creditsAcquired: result?.creditsAcquired,
        totalCredits: totalCredits,
        isValidated: result?.isValidated,
        isCompensated: result?.isCompensated
      };
    });
    
    const uesDataS6 = uesS6.map(ue => {
      const result = ueResultsS6.find(r => r.ueId === ue.id);
      const totalCredits = ue.Subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
      return {
        name: ue.name,
        average: result?.average,
        creditsAcquired: result?.creditsAcquired,
        totalCredits: totalCredits,
        isValidated: result?.isValidated,
        isCompensated: result?.isCompensated
      };
    });
    
    const semester5Data = {
      classAverage: s5ClassAvg,
      rank: s5Rank,
      ues: uesDataS5
    };
    
    const semester6Data = {
      classAverage: s6ClassAvg,
      rank: s6Rank,
      ues: uesDataS6
    };
    
    const pdfBuffer = await pdfGenerator.generateBulletinAnnuel(
      student, annualResult, semester5Result, semester6Result, semester5Data, semester6Data
    );
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin_annuel_${year}_${student.matricule}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSemesters,
  getBulletinBySemesterId,
  getBulletinBySemesterCode,
  getBulletinAnnuelByYear,
  getLatestBulletin
};
