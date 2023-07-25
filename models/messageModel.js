import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recepient_id: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isReaded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
