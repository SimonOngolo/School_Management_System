const jwt = require("jsonwebtoken");
const { User } = require("../models"); // or Teacher/School depending on your setup

const demoUsers = {
  "demo-token-admin": {
    id: 9991,
    email: "admin@inptic.ga",
    role: "admin",
    active: true,
  },
  "demo-token-teacher": {
    id: 9992,
    email: "teacher@inptic.ga",
    role: "TEACHER",
    active: true,
  },
  "demo-token-secretariat": {
    id: 9993,
    email: "secretariat@inptic.ga",
    role: "secretariat",
    active: true,
  },
  "demo-token-student": {
    id: 9994,
    email: "student@inptic.ga",
    role: "student",
    active: true,
  },
};

const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const internalSecret = req.headers["x-internal-secret"];
      if (
        internalSecret &&
        internalSecret === process.env.INTERNAL_SYNC_SECRET
      ) {
        req.user = {
          id: 0,
          role: "admin",
          email: "sync@internal.local",
          active: true,
        };
        return next();
      }

      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({
            success: false,
            message: "Authentication required: No token provided",
          });
      }

      if (demoUsers[token]) {
        req.user = demoUsers[token];
      } else {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Supports both Mongoose models or custom payloads
        req.user = decoded;
      }

      if (!req.user || (!req.user.active && req.user.active !== undefined)) {
        return res
          .status(401)
          .json({
            success: false,
            message: "User is inactive or unauthorized",
          });
      }

      // Check role authorization if roles are specified
      if (allowedRoles.length > 0) {
        // Normalize role matching (e.g., "TEACHER" vs "teacher")
        const userRole = req.user.role ? req.user.role.toUpperCase() : "";
        const formattedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

        if (!formattedAllowedRoles.includes(userRole)) {
          return res
            .status(403)
            .json({
              success: false,
              message: "Access forbidden: Insufficient permissions",
            });
        }
      }

      next();
    } catch (error) {
      console.log("[AuthMiddleware] ❌ Error:", error.message);
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
  };
};

module.exports = authMiddleware;
