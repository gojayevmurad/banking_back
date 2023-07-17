import express from "express";
import mongoose from "mongoose";

import notificationModel from "../models/notificationModel.js";
import transactionModel from "../models/transactionModel.js";

import { authenticateToken } from "../utils/jwt.js";
import userModel from "../models/userModel.js";

const router = express.Router();

// outcome
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { amount, userId } = req.body;
    const senderId = req.data.user;

    const modelExist = await transactionModel.findOne({ userId });
    const sender = await userModel.findOne(
      { _id: senderId },
      "transactionsHistory"
    );

    if (modelExist) {
      modelExist.transactions.push({
        amount,
        sender: senderId,
      });
      await modelExist.save();
      return res.status(200).json({ message: "Uğurlu əməliyyat" });
    }

    await transactionModel.create({
      userId,
      transactions: [{ amount, sender: senderId }],
    });

    //#region  update transaction history
    sender.transactionsHistory.push({
      userId,
      amount: -amount,
      status: "Pending",
    });

    await sender.save();
    //#endregion  update transaction history

    return res.status(200).json({ message: "Uğurlu əməliyyat" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// income

router.get("/get", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const transaction = await transactionModel.findOne({ userId });
    const user = await userModel.findOne(
      { _id: userId },
      "transactionsHistory"
    );

    if (!transaction) {
      return res.status(200).json({ data: [] });
    }

    //#region

    //#endregion

    return res.status(200).json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// accept transaction

router.get("/accept/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const transactionId = req.params.id;

    const transactionsList = await transactionModel.findOne(
      { userId },
      "transactions"
    );
    const user = await userModel.findOne(
      { _id: userId },
      "transactionsHistory"
    );

    for (let i = 0; i < transactionsList.transactions.length; i++) {
      let item = transactionsList.transactions[i];
      if (item._id.toString() == transactionId) {
        user.transactionsHistory.unshift({
          userId: item.sender,
          amount: item.amount,
          status: true,
        });

        item.isRecieve = true;
      }
    }

    await transactionsList.save();
    await user.save();

    return res.status(200).json({ data: user.transactionsHistory });
  } catch (err) {
    return res.status(200).json({ message: err.message });
  }
});

export default router;
