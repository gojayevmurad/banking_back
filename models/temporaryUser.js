import mongoose from "mongoose";

const temporaryUser = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  OTP: {
    type: String,
    required: true,
  },
});

export default mongoose.model("temporaryUser", temporaryUser);
