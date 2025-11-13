// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { randomUUID } from "crypto";
import FormEntry from "../models/FormEntry.js"; // import FormEntry to query by uid

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = randomUUID();

    const user = await User.create({ uid, name, email, password: hashedPassword });

    // Put uid into token (cookie)
    generateToken(res, user.uid);

    res.status(201).json({
      message: "User registered successfully",
      user: { uid: user.uid, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Put the application uid into the token (not Mongo _id)
    generateToken(res, user.uid);

    // ✅ Fetch form to check submission status using user.uid (string)
    const form = await FormEntry.findOne({ userId: user.uid });
    const isSubmitted = form ? form.isSubmitted : false;

    res.status(200).json({
      message: "Login successful",
      user: { uid: user.uid, name: user.name, email: user.email },
      isSubmitted,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify
export const verifyToken = async (req, res) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.userId is uid (string)
    const user = await User.findOne({ uid: decoded.userId }).select("uid name email");

    if (!user) return res.status(401).json({ message: "Invalid token" });

    res.status(200).json({ loggedIn: true, user });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(401).json({ loggedIn: false, message: "Unauthorized" });
  }
};

// Logout
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
};
