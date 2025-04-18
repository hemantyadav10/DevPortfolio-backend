import express from 'express';
import errorHandler from './middlewares/errorHandler.middleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import endorsementRouter from './routes/endorsement.route.js';
import statsRouter from './routes/stats.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthRouter from './routes/healthcheck.routes.js';

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
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/health", healthRouter);

// Global error handling middleware
app.use(errorHandler);

export { app }

