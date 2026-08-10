const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UE = sequelize.define('UE', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  coefficient: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1
  }
}, {
  tableName: 'ues',
  timestamps: true
});

module.exports = UE;
