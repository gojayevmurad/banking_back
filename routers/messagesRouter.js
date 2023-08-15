import express from "express";

import { authenticateToken } from "../utils/jwt.js";
import messageModel from "../models/messageModel.js";

const router = express.Router();

router.get("/get-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const { contactId } = req.query;

    const messagesList = await messageModel.find({
      $or: [
        { senderId: userId, recipientId: contactId },
        { senderId: contactId, recipientId: userId },
      ],
    });

    return res.status(200).json({ data: messagesList, contactId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
