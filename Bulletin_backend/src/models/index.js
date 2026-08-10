const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const Group = require('./Group');
const Semester = require('./Semester');
const UE = require('./UE');
const Subject = require('./Subject');
const Grade = require('./Grade');
const Absence = require('./Absence');
const SubjectResult = require('./SubjectResult');
const UEResult = require('./UEResult');
const SemesterResult = require('./SemesterResult');
const AnnualResult = require('./AnnualResult');
const AuditLog = require('./AuditLog');
const GroupUE = require('./GroupUE');
const TeacherGroup = require('./TeacherGroup');
const TeacherSubject = require('./TeacherSubject');

// User associations
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// Group associations
Group.hasMany(Student, { foreignKey: 'groupId' });
Student.belongsTo(Group, { foreignKey: 'groupId' });

// Student associations
Student.hasMany(Grade, { foreignKey: 'studentId' });
Grade.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(Absence, { foreignKey: 'studentId' });
Absence.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(SubjectResult, { foreignKey: 'studentId' });
SubjectResult.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(UEResult, { foreignKey: 'studentId' });
UEResult.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(SemesterResult, { foreignKey: 'studentId' });
SemesterResult.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(AnnualResult, { foreignKey: 'studentId' });
AnnualResult.belongsTo(Student, { foreignKey: 'studentId' });

// Subject associations
Subject.hasMany(Grade, { foreignKey: 'subjectId' });
Grade.belongsTo(Subject, { foreignKey: 'subjectId' });

Subject.hasMany(Absence, { foreignKey: 'subjectId' });
Absence.belongsTo(Subject, { foreignKey: 'subjectId' });

Subject.hasMany(SubjectResult, { foreignKey: 'subjectId' });
SubjectResult.belongsTo(Subject, { foreignKey: 'subjectId' });

// Semester associations
Semester.hasMany(UE, { foreignKey: 'semesterId' });
UE.belongsTo(Semester, { foreignKey: 'semesterId' });

Semester.hasMany(SemesterResult, { foreignKey: 'semesterId' });
SemesterResult.belongsTo(Semester, { foreignKey: 'semesterId' });

// UE associations
UE.hasMany(Subject, { foreignKey: 'ueId' });
Subject.belongsTo(UE, { foreignKey: 'ueId' });

UE.hasMany(UEResult, { foreignKey: 'ueId' });
UEResult.belongsTo(UE, { foreignKey: 'ueId' });

// GroupUE associations (liaison many-to-many)
Group.belongsToMany(UE, { through: GroupUE, foreignKey: 'groupId', as: 'UEs' });
UE.belongsToMany(Group, { through: GroupUE, foreignKey: 'ueId', as: 'Groups' });

// TeacherGroup associations (liaison enseignant-groupe)
User.belongsToMany(Group, { through: TeacherGroup, foreignKey: 'teacherId', as: 'TeacherGroups' });
Group.belongsToMany(User, { through: TeacherGroup, foreignKey: 'groupId', as: 'Teachers' });

// TeacherSubject associations (liaison enseignant-matière)
User.belongsToMany(Subject, { through: TeacherSubject, foreignKey: 'teacherId', as: 'TeacherSubjects' });
Subject.belongsToMany(User, { through: TeacherSubject, foreignKey: 'subjectId', as: 'Teachers' });

// Grade-User association (audit trail)
User.hasMany(Grade, { foreignKey: 'enteredBy', as: 'EnteredGrades' });
Grade.belongsTo(User, { foreignKey: 'enteredBy', as: 'EnteredBy' });

module.exports = {
  sequelize,
  User,
  Student,
  Group,
  Semester,
  UE,
  Subject,
  Grade,
  Absence,
  SubjectResult,
  UEResult,
  SemesterResult,
  AnnualResult,
  AuditLog,
  GroupUE,
  TeacherGroup,
  TeacherSubject
};
