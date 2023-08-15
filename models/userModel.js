import mongoose from "mongoose";

const transactionsHistoryItemSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: mongoose.Schema.Types.Mixed,
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
  title: {
    type: String,
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  categoryId: {
    type: String,
  },
  fromCard: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
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

const contactItem = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  date: {
    type: Date,
    default: () => Date.now(),
  },
  contactPop: {
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
    profile_photo: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordToken: String,
    contacts: [contactItem],
    incomeCategories: [earningCategoriesItem],
    outcomeCategories: [expenseCategoriesItem],
    transactionsHistory: [transactionsHistoryItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
// userName ,operating_system , browser_name , support_url,action_url
//action_url browser_name operating_system action_url userName