// controllers/formController.js
import multer from "multer";
import path from "path";
import fs from "fs";
import FormEntry from "../models/FormEntry.js";
import User from "../models/User.js";

const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Multer storage: safer filename creation using user.uid (string).
 * If req.user is missing, filename will include "anon".
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const idPart = req.user?.uid || "anon";
    cb(null, `${idPart}_${Date.now()}_${safeName}`);
  },
});
export const upload = multer({ storage });

/**
 * uploadProfile
 * - requires authentication (req.user)
 * - saves/updates FormEntry.profilePic
 */
export const uploadProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const userId = req.user.uid; // using uid (string)
    const imagePath = `/${UPLOAD_DIR}/${req.file.filename}`;

    const updated = await FormEntry.findOneAndUpdate(
      { userId },
      { $set: { profilePic: imagePath, userId } }, // ensure userId present on upsert
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      imagePath: updated.profilePic,
    });
  } catch (error) {
    console.error("Upload profile error:", error);
    res.status(500).json({ message: "Server error uploading profile" });
  }
};

/**
 * getFormData
 * - returns the form entry for the logged-in user (creates if missing)
 * - includes basic user info from req.user
 */
export const getFormData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.uid;
    let form = await FormEntry.findOne({ userId });
    if (!form) {
      form = await FormEntry.create({ userId });
    }

    res.status(200).json({
      ...form.toObject(),
      user: {
        name: req.user.name || "",
        email: req.user.email || "",
        uid: req.user.uid || undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching form data:", error);
    res.status(500).json({ message: "Server error while fetching form data" });
  }
};

/**
 * saveStepData
 * - autosave for step data (step param expected)
 * - example route: POST /api/form/step/1
 */
export const saveStepData = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.uid;
    const { step } = req.params;
    const stepKey = `step${step}`;
    const data = req.body;

    if (!/^step\d+$/.test(stepKey))
      return res.status(400).json({ message: "Invalid step key" });

    const update = { [stepKey]: data };
    const form = await FormEntry.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: `Step ${step} saved`, form });
  } catch (error) {
    console.error("Error saving step:", error);
    res.status(500).json({ message: "Server error while saving step" });
  }
};

/**
 * submitForm
 * - final submission: marks isSubmitted true
 */
export const submitForm = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.uid;
    await FormEntry.findOneAndUpdate(
      { userId },
      { $set: { isSubmitted: true } },
      { upsert: true }
    );
    res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error("Submit form error:", error);
    res.status(500).json({ message: "Error submitting form" });
  }
};

/**
 * checkSubmissionStatus
 * - returns boolean isSubmitted
 */
export const checkSubmissionStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.uid;
    const form = await FormEntry.findOne({ userId });
    res.status(200).json({ isSubmitted: form?.isSubmitted || false });
  } catch (error) {
    console.error("Check submission status error:", error);
    res.status(500).json({ message: "Server error checking submission" });
  }
};
