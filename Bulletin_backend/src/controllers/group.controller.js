const { Group, Student } = require("../models");

// Récupérer tous les groupes (Accessible to authenticated users including students)
const getAllGroups = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const where = {};
    if (academicYear) where.academicYear = academicYear;

    const groups = await Group.findAll({
      where,
      include: [
        {
          model: Student,
          attributes: ["id", "matricule", "firstName", "lastName"],
        },
      ],
    });
    res.json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
};

// Récupérer un groupe par ID
const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          attributes: ["id", "matricule", "firstName", "lastName"],
        },
      ],
    });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Groupe non trouvé" });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Créer un groupe (Restricted in routes to admin/secretariat/teacher)
const createGroup = async (req, res, next) => {
  try {
    const { name, academicYear } = req.body;

    const existingGroup = await Group.findOne({
      where: { name, academicYear },
    });
    if (existingGroup) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Ce groupe existe déjà pour cette année académique",
        });
    }

    const group = await Group.create({ name, academicYear });
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Modifier un groupe (Restricted in routes to admin/secretariat/teacher)
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Groupe non trouvé" });
    }

    await group.update(req.body);
    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
};

// Supprimer un groupe (Restricted in routes to admin/secretariat/teacher)
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Groupe non trouvé" });
    }

    // Vérifier s'il y a des étudiants dans ce groupe
    const studentCount = await Student.count({ where: { groupId: group.id } });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce groupe car il contient ${studentCount} étudiant(s)`,
      });
    }

    await group.destroy();
    res.json({ success: true, message: "Groupe supprimé" });
  } catch (error) {
    next(error);
  }
};

// Récupérer les années académiques disponibles
const getAcademicYears = async (req, res, next) => {
  try {
    const years = await Group.findAll({
      attributes: ["academicYear"],
      group: ["academicYear"],
      order: [["academicYear", "DESC"]],
    });
    res.json({ success: true, data: years.map((y) => y.academicYear) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getAcademicYears,
};
