const { Semester, UE, Subject } = require('../models');

const getAllSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.findAll({
      include: [{
        model: UE,
        include: [Subject]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: semesters });
  } catch (error) {
    next(error);
  }
};

const getSemesterById = async (req, res, next) => {
  try {
    const semester = await Semester.findByPk(req.params.id, {
      include: [{
        model: UE,
        include: [Subject]
      }]
    });
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semestre non trouvé' });
    }
    res.json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

const createSemester = async (req, res, next) => {
  try {
    const { name, code, totalCredits, academicYear } = req.body;
    
    // Vérifier si le code existe déjà
    const existing = await Semester.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ce code de semestre existe déjà' });
    }

    const semester = await Semester.create({ name, code, totalCredits, academicYear });
    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

const updateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semestre non trouvé' });
    }

    const { name, code, totalCredits, academicYear } = req.body;
    
    // Vérifier l'unicité du code si changé
    if (code && code !== semester.code) {
      const existing = await Semester.findOne({ where: { code } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Ce code de semestre existe déjà' });
      }
    }

    await semester.update({ name, code, totalCredits, academicYear });
    res.json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

const deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) {
      return res.status(404).json({ success: false, message: 'Semestre non trouvé' });
    }

    // Vérifier s'il y a des UE associées
    const ueCount = await UE.count({ where: { semesterId: semester.id } });
    if (ueCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer : ${ueCount} UE(s) associée(s)` 
      });
    }

    await semester.destroy();
    res.json({ success: true, message: 'Semestre supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester
};
