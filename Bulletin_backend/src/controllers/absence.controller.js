const { Absence, Student, Subject } = require('../models');

const getAbsencesByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const absences = await Absence.findAll({
      where: { studentId },
      include: [{ model: Subject, attributes: ['name'] }]
    });
    res.json({ success: true, data: absences });
  } catch (error) {
    next(error);
  }
};

const upsertAbsence = async (req, res, next) => {
  try {
    const { studentId, subjectId, hours } = req.body;
    
    const [absence, created] = await Absence.upsert({
      studentId,
      subjectId,
      hours
    });
    
    res.json({ 
      success: true, 
      message: created ? 'Absence créée' : 'Absence mise à jour',
      data: absence 
    });
  } catch (error) {
    next(error);
  }
};

const deleteAbsence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Absence.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Absence non trouvée' });
    }
    
    res.json({ success: true, message: 'Absence supprimée' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAbsencesByStudent, upsertAbsence, deleteAbsence };
