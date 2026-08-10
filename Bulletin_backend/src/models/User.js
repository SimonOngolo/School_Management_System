const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'secretariat', 'student'),
    allowNull: false,
    defaultValue: 'student'
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        console.log('🔐 Hachage mot de passe pour:', user.email);
        user.password = await bcrypt.hash(user.password, 10);
        console.log('✅ Mot de passe haché');
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        console.log('🔐 Mise à jour mot de passe pour:', user.email);
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  console.log('🔑 Comparaison mot de passe...');
  console.log('Password fourni:', password);
  console.log('Hash stocké:', this.password);
  const result = await bcrypt.compare(password, this.password);
  console.log('Résultat comparaison:', result);
  return result;
};

module.exports = User;
