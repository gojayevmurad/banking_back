import messageModel from "../../models/messageModel.js";
import userModel from "../../models/userModel.js";

const saveMessage = async (senderId, recipientId, content) => {
  const newMessage = {
    recipientId,
    senderId,
    content,
  };

  const userProfile = await userModel.findOne(
    { _id: senderId },
    "profile_photo -_id name surname"
  );

  await messageModel.create(newMessage);

  return {
    ...newMessage,
    sender_photo: userProfile.profile_photo,
    sender: userProfile.name + " " + userProfile.surname,
  };
};

const readMessage = async (senderId, recipientId) => {
  const messagesList = await messageModel.find({
    recipientId,
    senderId,
    isReaded: false,
  });

  messagesList.forEach(async (message) => {
    message.isReaded = true;
    await message.save();
  });
};

export { saveMessage, readMessage };
