const multer = require('multer');
const ExcelJS = require('exceljs');
const { Student, Group, Subject, Grade, Semester, UE, SubjectResult, SemesterResult, AnnualResult, sequelize } = require('../models');

const upload = multer({ storage: multer.memoryStorage() });

// Fonction de recalcul (importée depuis grade.controller)
const { recalculateAllForStudent } = require('./grade.controller');

// Import des notes depuis Excel
const importGradesFromExcel = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    const results = { success: 0, errors: 0, details: [] };
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const matricule = row.getCell(1).value;
      const subjectName = row.getCell(2).value;
      const ccNote = row.getCell(3).value;
      const examNote = row.getCell(4).value;
      const rattrapageNote = row.getCell(5).value;
      
      const student = await Student.findOne({ where: { matricule }, transaction });
      if (!student) {
        results.errors++;
        results.details.push({ matricule, error: 'Étudiant non trouvé' });
        continue;
      }
      
      const subject = await Subject.findOne({ where: { name: subjectName }, transaction });
      if (!subject) {
        results.errors++;
        results.details.push({ matricule, subjectName, error: 'Matière non trouvée' });
        continue;
      }
      
      if (ccNote !== null && ccNote !== undefined && ccNote !== '') {
        await Grade.upsert({
          studentId: student.id,
          subjectId: subject.id,
          type: 'CC',
          value: parseFloat(ccNote)
        }, { transaction });
      }
      
      if (examNote !== null && examNote !== undefined && examNote !== '') {
        await Grade.upsert({
          studentId: student.id,
          subjectId: subject.id,
          type: 'EXAM',
          value: parseFloat(examNote)
        }, { transaction });
      }
      
      if (rattrapageNote !== null && rattrapageNote !== undefined && rattrapageNote !== '') {
        await Grade.upsert({
          studentId: student.id,
          subjectId: subject.id,
          type: 'RATTRAPAGE',
          value: parseFloat(rattrapageNote)
        }, { transaction });
      }
      
      if (typeof recalculateAllForStudent === 'function') {
        await recalculateAllForStudent(student.id, transaction);
      }
      results.success++;
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Import terminé: ${results.success} réussis, ${results.errors} échecs`,
      data: results
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Import des étudiants depuis Excel (avec groupe)
const importStudentsFromExcel = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    const results = { success: 0, errors: 0, details: [] };
    
    // Map pour trouver ou créer les groupes
    const groupCache = {};
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const matricule = row.getCell(1).value?.toString().trim();
      const lastName = row.getCell(2).value?.toString().trim();
      const firstName = row.getCell(3).value?.toString().trim();
      const birthDate = row.getCell(4).value;
      const birthPlace = row.getCell(5).value?.toString().trim();
      const bacType = row.getCell(6).value?.toString().trim();
      const originSchool = row.getCell(7).value?.toString().trim();
      const groupName = row.getCell(8).value?.toString().trim();
      const academicYear = row.getCell(9).value?.toString().trim() || '2024-2025';
      
      if (!matricule || !lastName || !firstName) {
        results.errors++;
        results.details.push({ row: rowNumber, error: 'Matricule, nom ou prénom manquant' });
        continue;
      }
      
      // Vérifier si l'étudiant existe déjà
      let student = await Student.findOne({ where: { matricule }, transaction });
      
      // Gérer le groupe si fourni
      let groupId = null;
      if (groupName) {
        const cacheKey = `${groupName}-${academicYear}`;
        if (!groupCache[cacheKey]) {
          let group = await Group.findOne({ 
            where: { name: groupName, academicYear },
            transaction 
          });
          if (!group) {
            // Créer le groupe s'il n'existe pas
            group = await Group.create({ name: groupName, academicYear }, { transaction });
          }
          groupCache[cacheKey] = group.id;
        }
        groupId = groupCache[cacheKey];
      }
      
      const studentData = {
        matricule,
        lastName,
        firstName,
        birthDate: birthDate || null,
        birthPlace: birthPlace || null,
        bacType: bacType || null,
        originSchool: originSchool || null,
        groupId
      };
      
      if (student) {
        await student.update(studentData, { transaction });
      } else {
        student = await Student.create(studentData, { transaction });
      }
      
      results.success++;
      results.details.push({ matricule, action: student ? 'mis à jour' : 'créé', group: groupName || null });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `Import étudiants terminé: ${results.success} réussis, ${results.errors} échecs`,
      data: results
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Export des décisions jury vers Excel
const exportJuryDecisions = async (req, res, next) => {
  try {
    const { groupId, academicYear } = req.query;
    const year = academicYear || '2024-2025';
    
    const where = {};
    if (groupId) where.groupId = groupId;
    
    const students = await Student.findAll({
      where,
      include: [
        { model: Group, attributes: ['name', 'academicYear'] },
        {
          model: AnnualResult,
          where: { academicYear: year },
          required: false
        }
      ]
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Decisions_Jury');
    
    worksheet.columns = [
      { header: 'Matricule', key: 'matricule', width: 15 },
      { header: 'Nom', key: 'lastName', width: 20 },
      { header: 'Prénom', key: 'firstName', width: 20 },
      { header: 'Groupe', key: 'group', width: 15 },
      { header: 'Moyenne Annuelle', key: 'average', width: 15 },
      { header: 'Crédits Totaux', key: 'credits', width: 12 },
      { header: 'Mention', key: 'mention', width: 15 },
      { header: 'Décision Jury', key: 'decision', width: 20 }
    ];
    
    for (const student of students) {
      // AnnualResult est retourné comme un tableau par Sequelize
      const annualResult = student.AnnualResults?.[0] || null;
      
      worksheet.addRow({
        matricule: student.matricule,
        lastName: student.lastName,
        firstName: student.firstName,
        group: student.Group?.name || 'N/A',
        average: annualResult?.average ? parseFloat(annualResult.average).toFixed(2) : 'N/A',
        credits: annualResult?.totalCredits || 0,
        mention: annualResult?.mention || 'N/A',
        decision: annualResult?.decision || 'NON ÉVALUÉ'
      });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=decisions_jury.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// Export relevé de notes par semestre
const exportSemesterGrades = async (req, res, next) => {
  try {
    const { semesterId } = req.params;
    const { groupId } = req.query;
    
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semestre non trouvé' });
    }
    
    const where = {};
    if (groupId) where.groupId = groupId;
    
    const students = await Student.findAll({
      where,
      include: [{ model: Group }]
    });
    const subjects = await Subject.findAll({
      include: [{ model: UE, where: { semesterId: semesterId } }]
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Releve_${semester.code}`);
    
    const headers = ['Matricule', 'Nom', 'Prénom'];
    for (const subject of subjects) {
      headers.push(`${subject.name} (CC)`);
      headers.push(`${subject.name} (Examen)`);
      headers.push(`${subject.name} (Moyenne)`);
    }
    headers.push('Moyenne Semestre', 'Crédits', 'Validation');
    worksheet.addRow(headers);
    
    for (const student of students) {
      const row = [student.matricule, student.lastName, student.firstName];

      for (const subject of subjects) {
        const ccGrade = await Grade.findOne({ where: { studentId: student.id, subjectId: subject.id, type: 'CC' } });
        const examGrade = await Grade.findOne({ where: { studentId: student.id, subjectId: subject.id, type: 'EXAM' } });
        const subjectResult = await SubjectResult.findOne({ where: { studentId: student.id, subjectId: subject.id } });

        row.push(ccGrade?.value ?? '-');
        row.push(examGrade?.value ?? '-');
        row.push(subjectResult?.average ? parseFloat(subjectResult.average).toFixed(2) : '-');
      }
      
      const semesterResult = await SemesterResult.findOne({
        where: { studentId: student.id, semesterId: semester.id }
      });
      
      row.push(semesterResult?.average ? parseFloat(semesterResult.average).toFixed(2) : '-');
      row.push(semesterResult?.totalCredits || 0);
      row.push(semesterResult?.isValidated ? 'VALIDÉ' : 'NON VALIDÉ');

      worksheet.addRow(row);
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=releve_${semester.code}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importGradesFromExcel,
  importStudentsFromExcel,
  exportJuryDecisions,
  exportSemesterGrades,
  upload
};
