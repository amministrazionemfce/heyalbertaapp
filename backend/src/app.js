import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes/index.js";

dotenv.config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGINS || "*",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Hey Alberta API running" });
});

app.use("/api", routes);

export default app;