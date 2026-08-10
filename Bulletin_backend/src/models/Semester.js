const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Semester = sequelize.define('Semester', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  totalCredits: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  academicYear: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'semesters',
  timestamps: true
});

module.exports = Semester;
