const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherSubject = sequelize.define('TeacherSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Subjects',
      key: 'id'
    }
  }
}, {
  tableName: 'TeacherSubjects',
  timestamps: true
});

module.exports = TeacherSubject;
