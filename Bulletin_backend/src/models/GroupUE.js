const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupUE = sequelize.define('GroupUE', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id'
    }
  },
  ueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ues',
      key: 'id'
    }
  }
}, {
  tableName: 'group_ues',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'ueId'],
      name: 'unique_group_ue'
    }
  ]
});

module.exports = GroupUE;
