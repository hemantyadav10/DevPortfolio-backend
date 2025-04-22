import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    isRead: false,
    recipient: req?.user._id
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { count }, 'notification count fetched successfully'))
});

const getAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, read } = req.query;

  const isRead = read === 'true' ? true : read === 'false' ? false : undefined;

  const matchStage = { recipient: req?.user._id }
  if (read && typeof isRead === 'boolean') {
    matchStage["isRead"] = isRead;
  }

  const pipeline = [
    {
      $match: matchStage
    },
    {
      $lookup: {
        from: 'users',
        localField: "sender",
        foreignField: "_id",
        as: "sender",
        pipeline: [
          {
            $project: {
              name: 1,
              username: 1,
              profilePictureUrl: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        sender: { $arrayElemAt: ["$sender", 0] }
      }
    },
    {
      $project: {
        expireAt: 0,
        updatedAt: 0,
        __v: 0,
      }
    }
  ];

  const aggregation = Notification.aggregate(pipeline);

  const notifications = await Notification.aggregatePaginate(aggregation, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort: { createdAt: -1 }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, 'Notifications fetched successfully'))

});

const deleteReadNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await Notification.deleteMany({ recipient: userId, isRead: true });

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount: result.deletedCount }, "Read notifications deleted"))
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await Notification.deleteMany({ recipient: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedCount: result.deletedCount }, "All notifications deleted"))
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { updateCount: result.modifiedCount }, "All notifications marked as read."))
});

const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    return res
      .status(404)
      .json(
        new ApiResponse(404, null, "Notification not found or not authorized")
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read."));

});

export {
  getUnreadNotificationCount,
  getAllNotifications,
  deleteReadNotifications,
  deleteAllNotifications,
  markAllAsRead, 
  markAsRead
}