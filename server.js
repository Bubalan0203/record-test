// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
await connectDB(); // if connectDB returns a Promise

const app = express();

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy (important on PaaS like Render for secure cookies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS: read allowed origins from env (comma-separated) or default to localhost
const rawOrigins = process.env.ALLOWED_ORIGINS || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map((u) => u.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(
          new Error("CORS policy: This origin is not allowed: " + origin),
          false
        );
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/form", formRoutes);

// Serve uploads (note: Render filesystem is ephemeral — see notes below)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic health check
app.get("/", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Example cookie set route to illustrate cookie options (optional)
app.get("/set-test-cookie", (req, res) => {
  res.cookie("test", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none", // if you use cross-site cookies from frontend
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });
  res.send("cookie set");
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
