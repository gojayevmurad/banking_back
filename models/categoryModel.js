import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  isIncome: {
    type: Boolean,
    required: true,
  },
  target: {
    type: Number,
  },
  amount: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    enum: ["orange", "purple", "blue", "red"],
  },
});

export default mongoose.model("Category", categorySchema);
