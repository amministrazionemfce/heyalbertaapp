import jwt from "jsonwebtoken";

export const createToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};