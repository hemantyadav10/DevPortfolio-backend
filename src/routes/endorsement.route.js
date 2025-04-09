import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js"
import {
  getRecentEndoresements,
  toggleEndorsement
} from "../controllers/endorsement.controller..js";

const router = Router();

router.route('/')
  .post(verifyJwt, toggleEndorsement)

router
  .route('/:userId')
  .get(getRecentEndoresements)

export default router;