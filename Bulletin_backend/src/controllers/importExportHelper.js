// Fonction de recalcul simplifiée (pour l'import)
const recalculateForStudent = async (studentId, transaction) => {
  try {
    const { recalculateAllForStudent } = require('./grade.controller');
    if (typeof recalculateAllForStudent === 'function') {
      await recalculateAllForStudent(studentId, transaction);
    }
  } catch (error) {
    console.log('Recalcul non disponible, ignoré');
  }
};
