const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coefficient: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 1
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  ueId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'ues',
      key: 'id'
    }
  },
  evaluationMode: {
    type: DataTypes.ENUM('MIXTE', 'EXAM_ONLY', 'CC_ONLY'),
    allowNull: false,
    defaultValue: 'MIXTE'
  }
}, {
  tableName: 'subjects',
  timestamps: true
});

module.exports = Subject;
