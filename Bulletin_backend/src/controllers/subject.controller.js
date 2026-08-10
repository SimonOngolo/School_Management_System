const { Subject, UE, Semester } = require('../models');

const getAllSubjects = async (req, res, next) => {
  try {
    const { ueId } = req.query;
    const where = ueId ? { ueId } : {};
    
    const subjects = await Subject.findAll({
      where,
      include: [{
        model: UE,
        include: [{
          model: Semester,
          attributes: ['id', 'name', 'code']
        }]
      }],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
};

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id, {
      include: [{
        model: UE,
        include: [{
          model: Semester,
          attributes: ['id', 'name', 'code']
        }]
      }]
    });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Matière non trouvée' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, coefficient, credits, ueId, evaluationMode } = req.body;
    
    // Vérifier si l'UE existe
    const ue = await UE.findByPk(ueId);
    if (!ue) {
      return res.status(400).json({ success: false, message: 'UE non trouvée' });
    }

    // Vérifier si le nom existe déjà dans cette UE
    const existing = await Subject.findOne({ where: { name, ueId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cette matière existe déjà dans cette UE' });
    }

    const subject = await Subject.create({ name, coefficient, credits, ueId, evaluationMode });
    
    // Retourner avec les associations
    const subjectWithAssoc = await Subject.findByPk(subject.id, {
      include: [{
        model: UE,
        include: [{
          model: Semester,
          attributes: ['id', 'name', 'code']
        }]
      }]
    });
    
    res.status(201).json({ success: true, data: subjectWithAssoc });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Matière non trouvée' });
    }

    const { name, coefficient, credits, ueId, evaluationMode } = req.body;
    
    // Vérifier l'unicité du nom si changé
    if (name && ueId && (name !== subject.name || ueId !== subject.ueId)) {
      const existing = await Subject.findOne({ where: { name, ueId } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Cette matière existe déjà dans cette UE' });
      }
    }

    await subject.update({ name, coefficient, credits, ueId, evaluationMode });
    
    const subjectWithAssoc = await Subject.findByPk(subject.id, {
      include: [{
        model: UE,
        include: [{
          model: Semester,
          attributes: ['id', 'name', 'code']
        }]
      }]
    });
    
    res.json({ success: true, data: subjectWithAssoc });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Matière non trouvée' });
    }

    // Vérifier s'il y a des notes associées
    const { Grade, Absence, SubjectResult } = require('../models');
    
    const [gradeCount, absenceCount, resultCount] = await Promise.all([
      Grade.count({ where: { subjectId: subject.id } }),
      Absence.count({ where: { subjectId: subject.id } }),
      SubjectResult.count({ where: { subjectId: subject.id } })
    ]);

    const totalRefs = gradeCount + absenceCount + resultCount;
    if (totalRefs > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer : ${totalRefs} référence(s) existante(s) (notes, absences ou résultats)` 
      });
    }

    await subject.destroy();
    res.json({ success: true, message: 'Matière supprimée' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
