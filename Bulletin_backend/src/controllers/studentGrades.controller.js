/**
 * Contrôleur spécifique pour les étudiants
 * Permet à un étudiant connecté de voir uniquement SES notes et bulletins
 * Filtre automatiquement par le groupe de l'étudiant
 */

const { Student, Grade, Subject, UE, Semester, Group, GroupUE, SubjectResult, UEResult, SemesterResult, AnnualResult } = require('../models');
const { Op } = require('sequelize');

// Récupérer les notes de l'étudiant connecté (filtrées par son groupe)
const getMyGrades = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Trouver l'étudiant lié à cet utilisateur
    const student = await Student.findOne({
      where: { userId },
      include: [{
        model: Group,
        as: 'Group',
        include: [{
          model: UE,
          as: 'UEs',
          include: [{
            model: Subject,
            as: 'Subjects'
          }]
        }]
      }]
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé pour cet utilisateur'
      });
    }
    
    // Récupérer les IDs des UE du groupe
    const groupUEIds = student.Group?.UEs?.map(ue => ue.id) || [];
    
    // Récupérer les IDs des matières de ces UE
    const subjectIds = [];
    student.Group?.UEs?.forEach(ue => {
      ue.Subjects?.forEach(subject => {
        subjectIds.push(subject.id);
      });
    });
    
    // Récupérer les notes de l'étudiant UNIQUEMENT pour ses matières
    const grades = await Grade.findAll({
      where: {
        studentId: student.id,
        subjectId: {
          [Op.in]: subjectIds.length > 0 ? subjectIds : [0] // [0] = aucun résultat si vide
        }
      },
      include: [{
        model: Subject,
        as: 'Subject',
        include: [{
          model: UE,
          as: 'UE',
          include: [{
            model: Semester,
            as: 'Semester'
          }]
        }]
      }]
    });
    
    // Organiser par semestre et UE
    const organized = organizeGradesBySemester(grades);
    
    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          matricule: student.matricule,
          firstName: student.firstName,
          lastName: student.lastName,
          group: student.Group?.name
        },
        grades: organized
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Récupérer le bulletin de l'étudiant connecté
const getMyBulletin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { semester } = req.query; // 'S5', 'S6', ou null pour annuel
    
    // Trouver l'étudiant
    const student = await Student.findOne({
      where: { userId },
      include: [{
        model: Group,
        as: 'Group'
      }]
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Étudiant non trouvé'
      });
    }
    
    let resultData;
    
    if (semester) {
      // Résultats semestriels
      const semesterResult = await SemesterResult.findOne({
        where: {
          studentId: student.id,
          semesterId: semester === 'S5' ? 1 : 2
        },
        include: [{
          model: Semester,
          as: 'Semester'
        }]
      });
      
      const ueResults = await UEResult.findAll({
        where: { studentId: student.id },
        include: [{
          model: UE,
          as: 'UE',
          where: { semesterId: semester === 'S5' ? 1 : 2 },
          include: [{
            model: Subject,
            as: 'Subjects',
            include: [{
              model: Grade,
              where: { studentId: student.id },
              required: false
            }]
          }]
        }]
      });
      
      resultData = {
        type: 'semester',
        semester,
        semesterResult,
        ueResults
      };
    } else {
      // Résultat annuel
      const annualResult = await AnnualResult.findOne({
        where: {
          studentId: student.id,
          academicYear: '2024-2025'
        }
      });
      
      const s5Result = await SemesterResult.findOne({
        where: { studentId: student.id, semesterId: 1 }
      });
      
      const s6Result = await SemesterResult.findOne({
        where: { studentId: student.id, semesterId: 2 }
      });
      
      resultData = {
        type: 'annual',
        annualResult,
        s5Result,
        s6Result
      };
    }
    
    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          matricule: student.matricule,
          firstName: student.firstName,
          lastName: student.lastName,
          group: student.Group?.name
        },
        results: resultData
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Fonction utilitaire pour organiser les notes
function organizeGradesBySemester(grades) {
  const organized = {};
  
  grades.forEach(grade => {
    const semesterName = grade.Subject?.UE?.Semester?.name || 'Non classé';
    const ueName = grade.Subject?.UE?.name || 'Non classé';
    const subjectName = grade.Subject?.name || 'Non classé';
    
    if (!organized[semesterName]) {
      organized[semesterName] = {};
    }
    
    if (!organized[semesterName][ueName]) {
      organized[semesterName][ueName] = {};
    }
    
    if (!organized[semesterName][ueName][subjectName]) {
      organized[semesterName][ueName][subjectName] = {
        subjectId: grade.Subject?.id,
        coefficient: grade.Subject?.coefficient,
        credits: grade.Subject?.credits,
        grades: {}
      };
    }
    
    organized[semesterName][ueName][subjectName].grades[grade.type] = {
      value: grade.value,
      dateRecorded: grade.dateRecorded
    };
  });
  
  return organized;
}

// Récupérer les matières disponibles pour un groupe (pour la saisie des notes)
const getSubjectsByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findByPk(groupId, {
      include: [{
        model: UE,
        as: 'UEs',
        include: [{
          model: Subject,
          as: 'Subjects'
        }, {
          model: Semester,
          as: 'Semester'
        }]
      }]
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    // Aplatir les matières
    const subjects = [];
    group.UEs?.forEach(ue => {
      ue.Subjects?.forEach(subject => {
        subjects.push({
          id: subject.id,
          name: subject.name,
          coefficient: subject.coefficient,
          credits: subject.credits,
          evaluationMode: subject.evaluationMode,
          ue: {
            id: ue.id,
            code: ue.code,
            name: ue.name,
            coefficient: ue.coefficient
          },
          semester: {
            id: ue.Semester?.id,
            name: ue.Semester?.name
          }
        });
      });
    });
    
    res.json({
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          academicYear: group.academicYear
        },
        subjects
      }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyGrades,
  getMyBulletin,
  getSubjectsByGroup
};
