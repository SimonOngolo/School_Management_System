require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./src/models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');
    
    // Supprimer l'ancien admin s'il existe
    await User.destroy({ where: { email: 'admin@inptic.ga' } });
    console.log('✅ Ancien admin supprimé');
    
    // Hacher le mot de passe 123admin
    const hashedPassword = await bcrypt.hash('123admin', 10);
    console.log('✅ Hash généré:', hashedPassword);
    
    // Créer le nouvel admin
    const admin = await User.create({
      email: 'admin@inptic.ga',
      password: '123admin',  // ← en clair, le hook le hache
      role: 'admin',
      firstName: 'Administrateur',
      lastName: 'Principal',
      active: true
    });
    
    console.log('\n🎉 ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('📧 Email: admin@inptic.ga');
    console.log('🔑 Mot de passe: 123admin');
    console.log('🆔 ID:', admin.id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();
