module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  penaltyAbsence: parseFloat(process.env.PENALTY_ABSENCE) || 0.01,
  ccWeight: parseFloat(process.env.CC_WEIGHT) || 0.4,
  examWeight: parseFloat(process.env.EXAM_WEIGHT) || 0.6
};
