import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import chunkRoutes from "./routes/chunkRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// Development-friendly CORS: allow all origins and common headers/methods
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);
// Ensure preflight requests are handled without using an invalid wildcard path
app.options(/.*/, cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/files/chunk", chunkRoutes);

app.use(errorHandler);

export { app };
