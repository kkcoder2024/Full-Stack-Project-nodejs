import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.use(cookieParser());

// import router
import { router } from "./routes/user.routes.js";
app.use("/api/v1/users", router);
// http://localhost:8000/users/register
// http://localhost:8000/users/login
export { app };
