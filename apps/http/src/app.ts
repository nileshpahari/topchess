import express from 'express';
import v1Router from './router/v1Router';
import cors from 'cors';
import { initPassport } from './passport';
import authRouter from './router/authRouter';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { COOKIE_MAX_AGE } from './constants';

const app = express();

dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.COOKIE_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: COOKIE_MAX_AGE },
  }),
);

initPassport();
app.use(passport.initialize());
app.use(passport.authenticate('session'));

app.use(
  cors({
    origin: process.env.ALLOWED_HOSTS || '*',
    credentials: true,
  }),
);

app.use('/auth', authRouter);
app.use('/v1', v1Router);

export default app;
