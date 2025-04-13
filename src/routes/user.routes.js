import { Router } from "express";
import {
  currentUser,
  fetchAllDevelopers,
  getDeveloperProfileInfo,
  getFeaturedDevelopers,
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
router.route('/logout').post(logout)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/current-user').get(verifyJwt, currentUser)
router.route('/update-profile').patch(verifyJwt, updateUserProfile)
router.route('/profile/:userId').get(getDeveloperProfileInfo)
router.route('/').get(fetchAllDevelopers)
router.get('/featured', getFeaturedDevelopers);

export default router;