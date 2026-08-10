const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeacherGroup = sequelize.define('TeacherGroup', {
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
    },
    onDelete: 'CASCADE'
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Groups',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'TeacherGroups',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teacherId', 'groupId']
    }
  ]
});

module.exports = TeacherGroup;
