/**
 * Script pour créer automatiquement les comptes utilisateurs
 * pour tous les étudiants existants sans compte
 * 
 * Usage: node src/scripts/createStudentAccounts.js
 */

const { Student, User } = require('../models');
const bcrypt = require('bcryptjs');

async function createStudentAccounts() {
  try {
    console.log('🔍 Recherche des étudiants sans compte utilisateur...');
    
    // Trouver tous les étudiants sans userId
    const studentsWithoutAccount = await Student.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`📊 ${studentsWithoutAccount.length} étudiants trouvés sans compte`);
    
    let created = 0;
    let errors = 0;
    
    for (const student of studentsWithoutAccount) {
      try {
        // Générer un email unique basé sur le matricule
        const email = `${student.matricule.toLowerCase()}@student.inptic.ga`;
        
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          console.log(`⚠️  L'email ${email} existe déjà, liaison avec l'étudiant ${student.matricule}...`);
          student.userId = existingUser.id;
          await student.save();
          continue;
        }
        
        // Mot de passe par défaut: premiere lettre du prenom + nom + @2025
        const defaultPassword = `${student.firstName.charAt(0).toLowerCase()}${student.lastName.toLowerCase()}@2025`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Créer le compte utilisateur
        const user = await User.create({
          email,
          password: hashedPassword,
          firstName: student.firstName,
          lastName: student.lastName,
          role: 'student',
          active: true
        });
        
        // Lier l'étudiant à son compte
        student.userId = user.id;
        await student.save();
        
        console.log(`✅ Compte créé: ${email} (ID: ${user.id}) pour ${student.firstName} ${student.lastName}`);
        console.log(`   🔑 Mot de passe par défaut: ${defaultPassword}`);
        created++;
        
      } catch (err) {
        console.error(`❌ Erreur pour l'étudiant ${student.matricule}:`, err.message);
        errors++;
      }
    }
    
    console.log('\n📋 RÉSULTAT:');
    console.log(`   ✅ Comptes créés: ${created}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📊 Total traité: ${studentsWithoutAccount.length}`);
    console.log('\n💡 Les étudiants peuvent maintenant se connecter avec:');
    console.log('   Email: {matricule}@student.inptic.ga');
    console.log('   Mot de passe: {prenom_initial}{nom}@2025');
    console.log('   Exemple: jpdupont@student.inptic.ga / jdupont@2025');
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createStudentAccounts();
}

module.exports = { createStudentAccounts };
