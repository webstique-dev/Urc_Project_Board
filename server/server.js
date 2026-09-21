import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { initSocket } from "./sockets/index.js";

import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Gzip / Deflate compression for all responses
app.use(compression());

const getOrigins = () => {
  if (!process.env.CLIENT_URL) return ["http://localhost:5173", "http://127.0.0.1:5173"];
  return process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/$/, ""));
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  try {
    const cleanOrigin = origin.replace(/\/$/, "");
    const allowed = getOrigins();
    if (allowed.includes("*") || allowed.includes(cleanOrigin)) return true;
    const hostname = new URL(origin).hostname;
    if (hostname.endsWith(".vercel.app") || hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    return allowed.some((a) => cleanOrigin.startsWith(a));
  } catch (err) {
    return false;
  }
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});
initSocket(io);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Lightweight health check endpoint for external ping services / uptime monitors (e.g. UptimeRobot, cron-job.org)
// Returns 200 without DB query to keep the dyno warm with zero performance penalty
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);

app.get("/", (req, res) => res.send("Trello-clone API is running"));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
