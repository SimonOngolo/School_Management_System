const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SemesterResult = sequelize.define('SemesterResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semesterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  average: {
    type: DataTypes.DECIMAL(5, 2)
  },
  totalCredits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isValidated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'semester_results',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'semesterId'],
      name: 'unique_student_semester'
    }
  ]
});

module.exports = SemesterResult;
