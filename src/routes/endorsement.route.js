import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { toggleEndorsement } from "../controllers/endorsement.controller..js";

const router = Router();

router.use(verifyJwt)

router.route('/')
  .post(toggleEndorsement)

export default router;