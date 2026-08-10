const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
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
  type: {
    type: DataTypes.ENUM('CC', 'EXAM', 'RATTRAPAGE'),
    allowNull: false
  },
  value: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 20
    }
  },
  dateRecorded: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  enteredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  tableName: 'grades',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'subjectId', 'type']
    }
  ]
});

module.exports = Grade;
