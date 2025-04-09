import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js"
import {
  getRecentEndoresements,
  getSkillEndorsements,
  toggleEndorsement
} from "../controllers/endorsement.controller..js";

const router = Router();

router.route('/')
  .post(verifyJwt, toggleEndorsement)

router
  .route('/recent/:userId')
  .get(getRecentEndoresements)

router.route('/:skillId')
  .get(getSkillEndorsements)

export default router;