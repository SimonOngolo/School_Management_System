require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
await sequelize.sync({ alter: true });
console.log("✅ Modèles synchronisés avec succès");
    
    // Désactivé pour éviter les conflits de contraintes
    // await sequelize.sync({ alter: false });
    console.log('✅ Modèles prêts (sync désactivé)');
    
    // Créer uniquement la table TeacherGroups si elle n'existe pas
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS TeacherGroups (
          id INT AUTO_INCREMENT PRIMARY KEY,
          teacherId INT NOT NULL,
          groupId INT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_teacher_group (teacherId, groupId),
          FOREIGN KEY (teacherId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (groupId) REFERENCES Groups(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table TeacherGroups vérifiée/créée');
    } catch (err) {
      console.log('ℹ️ Table TeacherGroups:', err.message);
    }

    // Créer la table TeacherSubjects si elle n'existe pas
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS TeacherSubjects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          teacherId INT NOT NULL,
          subjectId INT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_teacher_subject (teacherId, subjectId),
          FOREIGN KEY (teacherId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (subjectId) REFERENCES Subjects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Table TeacherSubjects vérifiée/créée');
    } catch (err) {
      console.log('ℹ️ Table TeacherSubjects:', err.message);
    }

    // Ajouter la colonne enteredBy à la table grades si elle n'existe pas
    try {
      // Vérifier si la colonne existe
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'grades' AND COLUMN_NAME = 'enteredBy'
      `);
      
      if (columns.length === 0) {
        await sequelize.query(`
          ALTER TABLE grades 
          ADD COLUMN enteredBy INT NULL,
          ADD CONSTRAINT fk_grades_user 
          FOREIGN KEY (enteredBy) REFERENCES Users(id) ON DELETE SET NULL
        `);
        console.log('✅ Colonne enteredBy ajoutée à grades');
      } else {
        console.log('✅ Colonne enteredBy déjà existante');
      }
    } catch (err) {
      console.log('ℹ️ Colonne enteredBy:', err.message);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
  }
};

startServer();
