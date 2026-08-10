const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UEResult = sequelize.define('UEResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ueId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  average: {
    type: DataTypes.DECIMAL(5, 2)
  },
  creditsAcquired: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isCompensated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'ue_results',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'ueId'],
      name: 'unique_student_ue'
    }
  ]
});

module.exports = UEResult;
