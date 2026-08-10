const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnnualResult = sequelize.define(
  "AnnualResult",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    average: {
      type: DataTypes.DECIMAL(5, 2),
    },
    totalCredits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    decision: {
      type: DataTypes.ENUM(
        "DIPLÔMÉ",
        "REPRISE_SOUTENANCE",
        "REDOUBLE",
        "NON_DIPLÔMÉ",
      ),
      defaultValue: "NON_DIPLÔMÉ",
    },
    mention: {
      type: DataTypes.ENUM("PASSABLE", "ASSEZ_BIEN", "BIEN", "TRÈS_BIEN"),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "annual_results",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "academicYear"],
        name: "unique_student_year",
      },
    ],
  },
);

module.exports = AnnualResult;
