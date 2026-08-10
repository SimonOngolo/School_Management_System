/**
 * Script pour nettoyer les doublons et créer la table group_ues
 */

const { sequelize } = require('../models');

async function fixDatabase() {
  try {
    console.log('🔧 Nettoyage de la base de données...');
    
    // 1. Supprimer les doublons dans subject_results (garder le plus récent)
    console.log('🧹 Suppression des doublons dans subject_results...');
    await sequelize.query(`
      DELETE sr1 FROM subject_results sr1
      INNER JOIN subject_results sr2 
      WHERE sr1.id < sr2.id 
      AND sr1.studentId = sr2.studentId 
      AND sr1.subjectId = sr2.subjectId
    `);
    console.log('✅ Doublons supprimés');
    
    // 2. Supprimer les doublons dans ue_results
    console.log('🧹 Suppression des doublons dans ue_results...');
    await sequelize.query(`
      DELETE ur1 FROM ue_results ur1
      INNER JOIN ue_results ur2 
      WHERE ur1.id < ur2.id 
      AND ur1.studentId = ur2.studentId 
      AND ur1.ueId = ur2.ueId
    `);
    console.log('✅ Doublons supprimés');
    
    // 3. Créer la table group_ues si elle n'existe pas
    console.log('🆕 Création de la table group_ues...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS group_ues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupId INT NOT NULL,
        ueId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_group_ue (groupId, ueId),
        FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (ueId) REFERENCES ues(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table group_ues créée');
    
    // 4. Ajouter userId à students si pas déjà fait
    console.log('🆕 Vérification de la colonne userId dans students...');
    try {
      await sequelize.query(`
        ALTER TABLE students ADD COLUMN userId INT NULL,
        ADD FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Colonne userId ajoutée');
    } catch (e) {
      console.log('ℹ️ Colonne userId existe déjà');
    }
    
    console.log('\n🎉 Base de données corrigée avec succès !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Associer les UE aux groupes via SQL ou admin');
    console.log('2. Générer les comptes étudiants : node src/scripts/createStudentAccounts.js');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixDatabase();
