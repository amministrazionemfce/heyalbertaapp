import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth)
    return res.status(401).json({ message: "Not authenticated" });

  const token = auth.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;
    if (!userId)
      return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(userId);

    if (!user)
      return res.status(401).json({ message: "User not found" });

    req.user = user;

    next();

  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};