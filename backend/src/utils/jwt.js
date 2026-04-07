import jwt from "jsonwebtoken";

export const createToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/** Short-lived token so an admin can preview the site as another user (JWT includes `imp` = admin id). */
export const createImpersonationToken = (targetUserId, targetRole, impersonatorAdminId) => {
  return jwt.sign(
    { sub: targetUserId, role: targetRole, imp: String(impersonatorAdminId) },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};