import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { dashboardStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(verifyJwt)

router.get("/", dashboardStats)

export default router;