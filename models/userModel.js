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

const earningCategoriesItem = mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    enum: ["blue", "orange", "red", "purple"],
  },
  target: {
    type: Number,
    required: true,
  },
});

const expenseCategoriesItem = mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    enum: ["blue", "orange", "red", "purple"],
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
    incomeCategories: [earningCategoriesItem],
    outcomeCategories: [expenseCategoriesItem],
    transactionsHistory: [transactionsHistoryItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
