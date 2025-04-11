import { Router } from "express";
import { optionalAuth, verifyJwt } from "../middlewares/auth.middleware.js"
import {
  addNewSkill,
  deleteSkill,
  getAllUserSkills,
  getUserSkillsByCategory,
  updateSkill
} from "../controllers/skill.controller.js";

const router = Router();

router
  .route('/:userId')
  .get(getUserSkillsByCategory)

router
  .route('/user/:userId')
  .get(optionalAuth, getAllUserSkills)

router.use(verifyJwt);

router
  .route('/')
  .post(addNewSkill)

router
  .route('/:skillId')
  .delete(deleteSkill)
  .patch(updateSkill)

export default router;