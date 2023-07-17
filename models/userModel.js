import mongoose from "mongoose";

const transactionsHistoryItemSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: Boolean || String,
    enum: ["Pending", true, false],
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
});

const categoriesItem = mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    incomeCategories: [categoriesItem],
    outcomeCategories: [categoriesItem],
    transactionsHistory: [transactionsHistoryItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
