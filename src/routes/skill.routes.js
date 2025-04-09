import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js"
import {
  addNewSkill,
  deleteSkill,
  updateSkill
} from "../controllers/skill.controller.js";

const router = Router();

router.use(verifyJwt);

router
  .route('/')
  .post(addNewSkill)

router
  .route('/:skillId')
  .delete(deleteSkill)
  .patch(updateSkill)

export default router;