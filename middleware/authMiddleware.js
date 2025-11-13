// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded.userId contains uid (the app-level id)
    const user = await User.findOne({ uid: decoded.userId }).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user; // includes uid and _id
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};
