import express from "express";
import {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify", protect, verifyToken); // 🔒 Protected verify route
router.post("/logout", logoutUser);

export default router;
