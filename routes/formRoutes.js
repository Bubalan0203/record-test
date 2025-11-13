// routes/formRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import FormEntry from "../models/FormEntry.js";

const router = express.Router();

// -------------------------
// Multer: store files using user.uid (string) in filename
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // fall back to "anon" though protect should ensure req.user exists
    const idPart = req.user?.uid || "anon";
    const safeExt = path.extname(file.originalname) || "";
    cb(null, `${idPart}_${Date.now()}${safeExt}`);
  },
});
const upload = multer({ storage });

// -------------------------
// GET /api/form  - get or create a form entry (by uid)
// -------------------------
router.get("/", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const userId = req.user.uid;

    // Find or create, but ensure userId is set on create/upsert
    let form = await FormEntry.findOne({ userId });
    if (!form) {
      form = await FormEntry.create({ userId });
    }

    // Attach user basic info from req.user (no extra DB call needed)
    res.status(200).json({
      ...form.toObject(),
      user: {
        name: req.user.name || "",
        email: req.user.email || "",
        uid: req.user.uid,
      },
    });
  } catch (err) {
    console.error("Error fetching form data:", err);
    res.status(500).json({ message: "Error fetching form data" });
  }
});

// -------------------------
// PATCH /api/form/step/:stepNumber - save a step (uses uid)
// -------------------------
router.patch("/step/:stepNumber", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const step = `step${req.params.stepNumber}`;
    if (!/^step\d+$/.test(step)) return res.status(400).json({ message: "Invalid step" });

    const update = { [step]: req.body, userId: req.user.uid }; // explicitly set userId
    const form = await FormEntry.findOneAndUpdate(
      { userId: req.user.uid },
      { $set: update },
      { new: true, upsert: true }
    );

    res.status(200).json(form);
  } catch (err) {
    console.error("Error updating form step:", err);
    res.status(500).json({ message: "Error updating form step" });
  }
});

// -------------------------
// POST /api/form/upload-profile - upload profile pic (multer)
// -------------------------
router.post("/upload-profile", protect, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;

    await FormEntry.findOneAndUpdate(
      { userId: req.user.uid },
      { $set: { profilePic: imagePath, userId: req.user.uid } },
      { upsert: true }
    );

    res.status(200).json({ message: "Profile picture uploaded successfully", imagePath });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// -------------------------
// POST /api/form/submit - mark final submission
// -------------------------
router.post("/submit", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const form = await FormEntry.findOneAndUpdate(
      { userId: req.user.uid },
      { $set: { isSubmitted: true, userId: req.user.uid } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Form submitted successfully", form });
  } catch (err) {
    console.error("Error submitting form:", err);
    res.status(500).json({ message: "Error submitting form" });
  }
});

// -------------------------
// GET /api/form/status - check submission status
// -------------------------
router.get("/status", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "User not authenticated" });

    const form = await FormEntry.findOne({ userId: req.user.uid });
    res.status(200).json({ isSubmitted: form?.isSubmitted || false });
  } catch (err) {
    console.error("Error fetching status:", err);
    res.status(500).json({ message: "Error fetching status" });
  }
});

export default router;
