const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.header("Authorization");
      if (!authHeader) {
        return res.status(401).json({ success: false, message: "No token." });
      }

      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      const userRole = req.user.role ? req.user.role.toUpperCase() : "";
      const allowedRoles = roles.map((r) => r.toUpperCase());

      if (roles.length > 0 && !allowedRoles.includes(userRole)) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied." });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }
  };
};

module.exports = authMiddleware;
