import userModel from "../../models/userModel.js";

const changeStatus = async (userId, isOnline) => {
  const user = await userModel.findOne({ _id: userId }, "isOnline");
  user.isOnline = isOnline;
  await user.save();
};

export { changeStatus };
