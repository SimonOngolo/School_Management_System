const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // Bypass role check if the internal sync secret header is valid
    const internalSecret = req.headers["x-internal-secret"];
    if (internalSecret && internalSecret === process.env.INTERNAL_SYNC_SECRET) {
      console.log(
        "[RoleMiddleware] ✅ Internal sync secret validated - bypassing role check",
      );
      return next();
    }

    if (!req.user) {
      console.log(
        "[RoleMiddleware] ❌ Not authenticated - req.user is missing",
      );
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    // Flatten roles if a single array argument is passed
    const flattenedRoles =
      allowedRoles.length === 1 && Array.isArray(allowedRoles[0])
        ? allowedRoles[0]
        : allowedRoles;

    // Normalization
    const rawRole = req.user.role;
    const userRole =
      typeof rawRole === "string"
        ? rawRole.toLowerCase().trim()
        : String(rawRole || "")
            .toLowerCase()
            .trim();
    const normalizedAllowedRoles = flattenedRoles.map((r) =>
      typeof r === "string"
        ? r.toLowerCase().trim()
        : String(r).toLowerCase().trim(),
    );

    console.log(
      `[RoleMiddleware] 👤 User role: "${userRole}" (original: "${rawRole}")`,
    );
    console.log(
      `[RoleMiddleware] ✅ Allowed roles: ${JSON.stringify(normalizedAllowedRoles)}`,
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log(
        `[RoleMiddleware] ❌ Access denied - role "${userRole}" not authorized`,
      );
      return res.status(403).json({
        success: false,
        message: "Access denied",
        debug: { userRole: rawRole, allowedRoles: normalizedAllowedRoles },
      });
    }

    console.log("[RoleMiddleware] ✅ Access authorized");
    next();
  };
};

module.exports = roleMiddleware;
