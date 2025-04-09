import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  refreshAccessToken,
  registerUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);
router.route('/logout').post(verifyJwt, logout)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/current-user').get(verifyJwt, currentUser)
router.route('/update-profile').patch(verifyJwt, updateUserProfile)

export default router;