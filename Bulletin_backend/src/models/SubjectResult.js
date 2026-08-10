const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubjectResult = sequelize.define('SubjectResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  average: {
    type: DataTypes.DECIMAL(5, 2)
  },
  rattrapageUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  penaltyApplied: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  tableName: 'subject_results',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'subjectId'],
      name: 'unique_student_subject'
    }
  ]
});

module.exports = SubjectResult;
