const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING
  },
  entityId: {
    type: DataTypes.INTEGER
  },
  oldValues: {
    type: DataTypes.TEXT
  },
  newValues: {
    type: DataTypes.TEXT
  },
  ipAddress: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'audit_logs',
  timestamps: true
});

module.exports = AuditLog;
