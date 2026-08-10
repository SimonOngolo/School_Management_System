const { User, Group, TeacherGroup, Student, UE, Subject, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/groups/:groupId/teachers - Récupérer les enseignants d'un groupe
const getGroupTeachers = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findByPk(groupId, {
      include: [{
        model: User,
        as: 'Teachers',
        where: { role: 'teacher' },
        required: false,
        attributes: ['id', 'email', 'firstName', 'lastName', 'role']
      }]
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    }

    // Récupérer les entrées de la table de liaison
    const teacherGroups = await TeacherGroup.findAll({
      where: { groupId },
      attributes: ['id', 'teacherId', 'groupId', 'createdAt', 'updatedAt']
    });

    // Mapper avec les détails des enseignants
    const result = teacherGroups.map(tg => {
      const teacher = group.Teachers?.find(t => t.id === tg.teacherId);
      return {
        id: tg.id,
        teacherId: tg.teacherId,
        groupId: tg.groupId,
        createdAt: tg.createdAt,
        updatedAt: tg.updatedAt,
        Teacher: teacher || null
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teachers/:teacherId/groups - Récupérer les groupes d'un enseignant
const getTeacherGroups = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' },
      include: [{
        model: Group,
        as: 'TeacherGroups',
        include: [{
          model: UE,
          as: 'UEs',
          include: [{ model: Subject }]
        }, {
          model: Student,
          attributes: ['id', 'matricule']
        }]
      }]
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Enseignant non trouvé' });
    }

    res.json({
      success: true,
      data: teacher.TeacherGroups || []
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/teacher-groups - Assigner un enseignant à un groupe
const assignTeacher = async (req, res, next) => {
  try {
    const { teacherId, groupId } = req.body;

    if (!teacherId || !groupId) {
      return res.status(400).json({
        success: false,
        message: 'teacherId et groupId sont requis'
      });
    }

    // Vérifier que l'utilisateur est bien un enseignant
    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' }
    });

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: 'L\'utilisateur n\'est pas un enseignant ou n\'existe pas'
      });
    }

    // Vérifier que le groupe existe
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Vérifier si l'affectation existe déjà
    const existing = await TeacherGroup.findOne({
      where: { teacherId, groupId }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cet enseignant est déjà affecté à ce groupe'
      });
    }

    // Créer l'affectation
    const teacherGroup = await TeacherGroup.create({ teacherId, groupId });

    res.status(201).json({
      success: true,
      message: 'Enseignant affecté au groupe avec succès',
      data: teacherGroup
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teacher-groups/:id - Retirer un enseignant d'un groupe
const removeTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacherGroup = await TeacherGroup.findByPk(id);
    if (!teacherGroup) {
      return res.status(404).json({
        success: false,
        message: 'Affectation non trouvée'
      });
    }

    await teacherGroup.destroy();

    res.json({
      success: true,
      message: 'Enseignant retiré du groupe avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teachers - Liste de tous les enseignants
const getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher', active: true },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/my/groups - Récupérer les groupes de l'enseignant connecté
const getMyGroups = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // Requête SQL directe pour récupérer les groupes de l'enseignant
    const groups = await sequelize.query(`
      SELECT g.*, COUNT(s.id) as studentCount
      FROM Groups g
      INNER JOIN TeacherGroups tg ON g.id = tg.groupId
      LEFT JOIN Students s ON s.groupId = g.id
      WHERE tg.teacherId = ?
      GROUP BY g.id
    `, {
      replacements: [teacherId],
      type: sequelize.QueryTypes.SELECT
    });

    // Si aucun groupe trouvé
    if (!groups || groups.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "Aucun groupe ne vous est actuellement affecté. Contactez l'administration pour plus d'informations."
      });
    }

    // Formater les données
    const formattedGroups = groups.map(g => ({
      id: g.id,
      name: g.name,
      code: g.code,
      description: g.description,
      studentCount: parseInt(g.studentCount) || 0,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt
    }));

    res.json({
      success: true,
      data: formattedGroups
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupTeachers,
  getTeacherGroups,
  getMyGroups,
  assignTeacher,
  removeTeacher,
  getAllTeachers
};
