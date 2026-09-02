import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/globalErrorHandler";
import config from "./config";
import passport from "passport";
import "./config/passport";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Field Nexus Backend",
  });
});

app.use(errorHandler);

app.use(notFound);

export default app;
