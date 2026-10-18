import express from "express";
import cors from "cors";

import usersRoutes from "./routes/users.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
}));

app.use(express.json({ limit: "1000kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "KKI Smart Connects API is running.",
  });
});

app.use("/api/users", usersRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

export default app;