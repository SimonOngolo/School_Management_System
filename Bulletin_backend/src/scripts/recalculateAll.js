/**
 * Script pour recalculer toutes les moyennes et crédits
 * Usage: node src/scripts/recalculateAll.js
 */

const { sequelize } = require('../models');
const gradeController = require('../controllers/grade.controller');

async function recalculateAll() {
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer tous les étudiants
    const { Student } = require('../models');
    const students = await Student.findAll({ attributes: ['id'] });
    
    console.log(`Recalcul pour ${students.length} étudiants...`);
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      console.log(`[${i + 1}/${students.length}] Recalcul pour l'étudiant ${student.id}...`);
      
      // Appeler la fonction de recalcul interne
      await gradeController.recalculateAllForStudent(student.id, transaction);
    }
    
    await transaction.commit();
    console.log('\n✅ Recalcul terminé avec succès !');
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Erreur lors du recalcul:', error);
    process.exit(1);
  }
}

// Exporter la fonction pour pouvoir l'appeler depuis une route API
module.exports = { recalculateAll };

// Si exécuté directement
if (require.main === module) {
  recalculateAll().then(() => {
    process.exit(0);
  });
}
