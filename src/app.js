import express from 'express';
import errorHandler from './middlewares/errorHandler.middleware.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketIO, socketAuth } from './socket/index.js';

// Route imports
import userRouter from './routes/user.routes.js';
import skillRouter from './routes/skill.routes.js';
import endorsementRouter from './routes/endorsement.route.js';
import statsRouter from './routes/stats.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthRouter from './routes/healthcheck.routes.js';
import notificationRouter from './routes/notification.routes.js';


const app = express();
const httpServer = createServer(app);  // Raw HTTP server

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set('io', io); // store io in app so it's accessible via req.app.get("io")

io.use(socketAuth);

initializeSocketIO();

// CORS config
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsers
app.use(express.json());

app.use(express.urlencoded({
  extended: true,
  limit: '16kb'
}));

// Cookie parser
app.use(cookieParser());

// API routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/skills", skillRouter);
app.use("/api/v1/endorsements", endorsementRouter);
app.use("/api/v1/stats", statsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/notifications", notificationRouter);

// Global error handler
app.use(errorHandler);

export { httpServer, io }

