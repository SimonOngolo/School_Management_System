const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nom du groupe (ex: ASUR1, ASUR2)'
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Année académique (ex: 2024-2025)'
  }
}, {
  tableName: 'groups',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'academicYear']
    }
  ]
});

module.exports = Group;
