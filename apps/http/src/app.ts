import "dotenv/config";
import express from "express";
import v1Router from "./router/v1Router";
import cors from "cors";
import { initPassport } from "./passport";
import authRouter from "./router/authRouter";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser";
import { COOKIE_MAX_AGE } from "./constants";

const app = express();

const allowedHosts = process.env.ALLOWED_HOSTS?.split(",")
  .map((host) => host.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedHosts?.length ? allowedHosts : true,
    credentials: true,
  }),
);
app.use(
  session({
    secret:
      process.env.COOKIE_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    },
  }),
);

initPassport();
app.use(passport.initialize());
app.use(passport.authenticate("session"));

app.use("/auth", authRouter);
app.use("/v1", v1Router);

export default app;
