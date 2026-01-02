import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import groupRoutes from "./routes/group.routes.js";
import userRoutes from "./routes/user.route.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Static files (for media uploads)
import path from "path";

// Static files (for media uploads)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/user", userRoutes);

// Health check
app.get("/", (_req, res) => {
  res.send("Forward Chat API is running ");
});

export default app;
