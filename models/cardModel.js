import mongoose from "mongoose";

const cardSchema = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cardName: {
    type: String,
    required: true,
  },
  bank: {
    type: String,
    default: "Tagih",
  },
  holderName: {
    type: String,
    required: true,
  },
  validThru: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  cardBalance: {
    type: Number,
    default: 0,
  },
  bgColor: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  cardType: {
    type: String,
    required: true,
  },
  cvc: {
    type: Number,
    required: true,
  },
  cardNumber: {
    type: Number,
    required: true,
  },
  isMain: {
    type: Boolean,
    default: false,
  },
  limit: {
    isActive: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    target: { type: Number, default: 100 },
  },
});

export default mongoose.model("Card", cardSchema);
