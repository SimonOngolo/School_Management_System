const { UE, Semester, Subject } = require('../models');

const getAllUEs = async (req, res, next) => {
  try {
    const { semesterId } = req.query;
    const where = semesterId ? { semesterId } : {};
    
    const ues = await UE.findAll({
      where,
      include: [
        { model: Semester, attributes: ['id', 'name', 'code'] },
        { model: Subject }
      ],
      order: [['code', 'ASC']]
    });
    res.json({ success: true, data: ues });
  } catch (error) {
    next(error);
  }
};

const getUEById = async (req, res, next) => {
  try {
    const ue = await UE.findByPk(req.params.id, {
      include: [
        { model: Semester, attributes: ['id', 'name', 'code'] },
        { model: Subject }
      ]
    });
    if (!ue) {
      return res.status(404).json({ success: false, message: 'UE non trouvée' });
    }
    res.json({ success: true, data: ue });
  } catch (error) {
    next(error);
  }
};

const createUE = async (req, res, next) => {
  try {
    const { code, name, coefficient, semesterId } = req.body;
    
    // Vérifier si le semestre existe
    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
      return res.status(400).json({ success: false, message: 'Semestre non trouvé' });
    }

    // Vérifier si le code existe déjà dans ce semestre
    const existing = await UE.findOne({ where: { code, semesterId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ce code d\'UE existe déjà dans ce semestre' });
    }

    const ue = await UE.create({ code, name, coefficient, semesterId });
    
    // Retourner avec les associations
    const ueWithAssoc = await UE.findByPk(ue.id, {
      include: [
        { model: Semester, attributes: ['id', 'name', 'code'] },
        { model: Subject }
      ]
    });
    
    res.status(201).json({ success: true, data: ueWithAssoc });
  } catch (error) {
    next(error);
  }
};

const updateUE = async (req, res, next) => {
  try {
    const ue = await UE.findByPk(req.params.id);
    if (!ue) {
      return res.status(404).json({ success: false, message: 'UE non trouvée' });
    }

    const { code, name, coefficient, semesterId } = req.body;
    
    // Vérifier l'unicité du code si changé
    if (code && semesterId && (code !== ue.code || semesterId !== ue.semesterId)) {
      const existing = await UE.findOne({ where: { code, semesterId } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Ce code d\'UE existe déjà dans ce semestre' });
      }
    }

    await ue.update({ code, name, coefficient, semesterId });
    
    const ueWithAssoc = await UE.findByPk(ue.id, {
      include: [
        { model: Semester, attributes: ['id', 'name', 'code'] },
        { model: Subject }
      ]
    });
    
    res.json({ success: true, data: ueWithAssoc });
  } catch (error) {
    next(error);
  }
};

const deleteUE = async (req, res, next) => {
  try {
    const ue = await UE.findByPk(req.params.id);
    if (!ue) {
      return res.status(404).json({ success: false, message: 'UE non trouvée' });
    }

    // Vérifier s'il y a des matières associées
    const subjectCount = await Subject.count({ where: { ueId: ue.id } });
    if (subjectCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer : ${subjectCount} matière(s) associée(s)` 
      });
    }

    await ue.destroy();
    res.json({ success: true, message: 'UE supprimée' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUEs,
  getUEById,
  createUE,
  updateUE,
  deleteUE
};
