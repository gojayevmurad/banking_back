import mongoose, { mongo } from "mongoose";

const notificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: () => Date.now(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Notification", notificationSchema);
