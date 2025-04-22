import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { deleteAllNotifications, deleteReadNotifications, getAllNotifications, getUnreadNotificationCount, markAllAsRead, markAsRead } from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJwt)

router.get('/count', getUnreadNotificationCount)
router.route('/')
  .get(getAllNotifications)
  .delete(deleteAllNotifications)
  .patch(markAllAsRead)
router.route('/:id').patch(markAsRead)
router.delete('/read', deleteReadNotifications)

export default router;