import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  url: String,
  isRead: {
    type: Boolean,
    default: false,
  },
  expireAt: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    expires: 0
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.plugin(mongooseAggregatePaginate);

export const Notification = mongoose.model("Notification", notificationSchema);