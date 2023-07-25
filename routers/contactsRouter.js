import express from "express";

import UserModel from "../models/userModel.js";
import ContactModel from "../models/contactModel.js";
import { authenticateToken } from "../utils/jwt.js";

const router = express.Router();

router.get("/get-contacts", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const contactList = await UserModel.findOne(
      { _id: userId },
      "-_id contacts"
    );

    const contactsId = contactList.contacts.map((contact) => contact.userId);

    const contacts = await UserModel.find(
      {
        _id: { $in: contactsId },
      },
      "name surname email"
    );

    return res.status(200).json({ data: contacts });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/get-pendings", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const pendings = await ContactModel.find(
      { recipientId: userId },
      "-_id -__v -recipientId"
    );

    const idList = pendings.map((item) => item.senderId);

    const pendingUsers = await UserModel.find(
      { _id: { $in: idList } },
      "name surname email"
    );

    return res.status(200).json({ data: pendingUsers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/send-request", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const { email } = req.body;

    const userProfile = await UserModel.findOne(
      { _id: userId },
      "contacts email"
    );
    if (userProfile.email == email) {
      return res
        .status(400)
        .json({ message: "Öz emailinizi daxil edə bilməzsiniz" });
    }

    const recipientUser = await UserModel.findOne({ email }, "_id contacts");

    if (!recipientUser) {
      return res.status(400).json({ message: "İstifadəçi tapılmadı" });
    }

    const isFriend = userProfile.contacts.some(
      (item) => item.userId.toString() == recipientUser._id.toString()
    );

    if (isFriend) {
      return res
        .status(400)
        .json({ message: "Sizin artıq əlaqəniz mövcuddur" });
    }

    const isRequestExist = await ContactModel.findOne({
      senderId: userId,
      recipientId: recipientUser._id,
    });

    if (isRequestExist) {
      return res
        .status(400)
        .json({ message: "Sizin sorğunuz artıq mövcuddur" });
    }

    const isRecipientHaveRequest = await ContactModel.findOne({
      senderId: recipientUser._id,
      recipientId: userId,
    });

    if (!isRecipientHaveRequest) {
      await ContactModel.create({
        senderId: userId,
        recipientId: recipientUser._id,
      });

      return res.status(200).json({ message: "istək göndərildi" });
    }

    await isRecipientHaveRequest.deleteOne();

    recipientUser.contacts.push({
      userId,
    });
    userProfile.contacts.push({
      userId: recipientUser._id,
    });

    await recipientUser.save();
    await userProfile.save();

    //#region get pendings

    const pendings = await ContactModel.find(
      { recipientId: userId },
      "-_id -__v -recipientId"
    );
    const idList = pendings.map((item) => item.senderId);

    const pendingUsers = await UserModel.find(
      { _id: { $in: idList } },
      "name surname email"
    );
    //#endregion get pendings

    //#region get contacts

    const contactList = await UserModel.findOne(
      { _id: userId },
      "-_id contacts"
    );
    const contactsId = contactList.contacts.map((contact) => contact.userId);

    const contacts = await UserModel.find(
      {
        _id: { $in: contactsId },
      },
      "name surname email"
    );
    //#endregion get contacts

    return res.status(200).json({
      message: "Əlaqə yaradıldı",
      data: contacts,
      pendings: pendingUsers,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/accept/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const senderId = req.params.id;

    const currentModel = await ContactModel.findOne({
      recipientId: userId,
      senderId,
    });

    if (!currentModel) {
      return res.status(400).json({ message: "Məlumatlar yanlışdır" });
    }

    await currentModel.deleteOne();

    const sender = await UserModel.findOne({ _id: senderId }, "contacts");
    const user = await UserModel.findOne({ _id: userId }, "contacts");

    sender.contacts.push({
      userId,
    });
    user.contacts.push({
      userId: senderId,
    });

    await user.save();
    await sender.save();
    //#region get contacts
    const contactList = await UserModel.findOne(
      { _id: userId },
      "-_id contacts"
    );

    const contactsId = contactList.contacts.map((contact) => contact.userId);

    const contacts = await UserModel.find(
      {
        _id: { $in: contactsId },
      },
      "name surname email"
    );
    //#endregion get contacts
    const pendings = await ContactModel.find(
      { recipientId: userId },
      "-_id -__v -recipientId"
    );

    const idList = pendings.map((item) => item.senderId);

    const pendingUsers = await UserModel.find(
      { _id: { $in: idList } },
      "name surname email"
    );

    return res.status(200).json({ data: contacts, pendings: pendingUsers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete("/reject/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const senderId = req.params.id;

    const currentModel = await ContactModel.findOne({
      recipientId: userId,
      senderId,
    });

    if (!currentModel) {
      return res.status(400).json({ message: "Məlumatlar yanlışdır" });
    }

    await currentModel.deleteOne();

    //#region get contacts
    const contactList = await UserModel.findOne(
      { _id: userId },
      "-_id contacts"
    );

    const contactsId = contactList.contacts.map((contact) => contact.userId);

    const contacts = await UserModel.find(
      {
        _id: { $in: contactsId },
      },
      "name surname email"
    );
    //#endregion get contacts
    //#region get pendings

    const pendings = await ContactModel.find(
      { recipientId: userId },
      "-_id -__v -recipientId"
    );
    const idList = pendings.map((item) => item.senderId);

    const pendingUsers = await UserModel.find(
      { _id: { $in: idList } },
      "name surname email"
    );
    //#endregion get pendings

    return res.status(200).json({ data: contacts, pendings: pendingUsers });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
