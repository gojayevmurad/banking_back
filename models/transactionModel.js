import mongoose from "mongoose";

const singleTransaction = new mongoose.Schema({
  sender: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: () => Date.now() },
  isRecieve: { type: Boolean, default: false },
});

const transactionModel = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  transactions: [singleTransaction],
});

export default mongoose.model("Transaction", transactionModel);
