import express from 'express';
import errorHandler from './middlewares/errorHandler.middleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import endorsementRouter from './routes/endorsement.route.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
  limit: '16kb'
}));

app.use(cookieParser());

// Use routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/skills", skillRouter);
app.use("/api/v1/endorsements", endorsementRouter);

// Global error handling middleware
app.use(errorHandler);

export { app }

