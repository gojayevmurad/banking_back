import express from "express";
import mongoose from "mongoose";

import transactionModel from "../models/transactionModel.js";
import userModel from "../models/userModel.js";
import Card from "../models/cardModel.js";

import { getLastWeekDates } from "../utils/date.js";
import { authenticateToken } from "../utils/jwt.js";
import categoryModel from "../models/categoryModel.js";
import cardModel from "../models/cardModel.js";

const router = express.Router();

// outcome
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { amount, userId, title, cardId, categoryId } = req.body;
    const senderId = req.data.user;

    const card = await Card.findOne({ _id: cardId });

    if (card.limit.isActive) {
      if (card.limit.amount + Number(amount) > card.limit.target) {
        return res.status(400).json({ message: "Kart limiti aşır" });
      }
    }

    if (card.cardBalance < amount) {
      return res.status(400).json({ message: "Yetərsiz balans" });
    }

    const modelExist = await transactionModel.findOne({ userId });
    const sender = await userModel.findOne(
      { _id: senderId },
      "transactionsHistory"
    );

    //#region  update transaction history
    const transactionId = new mongoose.mongo.ObjectId();
    card.cardBalance -= amount;
    sender.transactionsHistory.push({
      userId,
      amount: -amount,
      status: "Pending",
      title,
      transactionId,
      categoryId,
      fromCard: cardId,
    });

    await sender.save();
    await card.save();
    //#endregion  update transaction history

    if (modelExist) {
      modelExist.transactions.push({
        amount,
        sender: senderId,
        title,
        transactionId,
        fromCard: cardId,
      });
      await modelExist.save();

      return res.status(200).json({ message: "Uğurlu əməliyyat" });
    }

    await transactionModel.create({
      userId,
      transactions: [
        { amount, sender: senderId, title, transactionId, fromCard: cardId },
      ],
    });

    return res.status(200).json({ message: "Uğurlu əməliyyat" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// income

router.get("/get-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const page = req.query.page ? parseInt(req.query.page) : 1;

    const user = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$transactionsHistory" },
      { $sort: { "transactionsHistory.date": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $group: {
          _id: "$_id",
          transactionsHistory: { $push: "$transactionsHistory" },
          total: { $sum: 1 },
        },
      },
    ]);
    if (!user.length) return res.status(200).json({ data: [], totalCount: 0 });

    const totalCount = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      { $project: { data: { $size: "$transactionsHistory" } } },
    ]);

    if (user[0].transactionsHistory.length == 0) {
      return res.status(200).json({ data: [] });
    }
    const idList = user[0]?.transactionsHistory.map((item) => {
      return item.userId;
    });

    const userList = await userModel.find(
      { _id: { $in: idList } },
      "email name surname profile_photo"
    );

    const sortedUserList = idList.map((id) =>
      userList.find((user) => user._id.toString() === id.toString())
    );

    const data = [];

    for (let i = 0; i < user[0].transactionsHistory.length; i++) {
      const transactionItem = user[0].transactionsHistory[i];
      const userItem = sortedUserList[i];
      data.push({
        _id: transactionItem._id,
        status: transactionItem.status,
        amount: transactionItem.amount,
        date: transactionItem.date,
        title: transactionItem.title,
        email: userItem.email,
        sender: userItem.name + " " + userItem.surname,
        profile_photo: userItem.profile_photo,
      });
    }
    return res.status(200).json({ data, total: totalCount[0].data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// accept transaction

router.put(
  "/accept/:id/:cardId/:categoryId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.data.user;
      const transactionId = req.params.id;
      const cardId = req.params.cardId;
      const categoryId = req.params.categoryId;

      const categoryItem = await categoryModel.findOne({
        userId: userId,
        _id: categoryId,
      });

      const transactionsList = await transactionModel.findOne(
        { userId },
        "transactions"
      );
      const user = await userModel.findOne(
        { _id: userId },
        "transactionsHistory"
      );
      const card = await cardModel.findOne({ _id: cardId });

      for (let i = 0; i < transactionsList.transactions.length; i++) {
        let item = transactionsList.transactions[i];
        if (item._id.toString() == transactionId) {
          //#region update sender history
          const sender = await userModel.findOne(
            { _id: item.sender },
            "transactionsHistory"
          );
          card.cardBalance += Math.abs(item.amount);

          for (let i = 0; i < sender.transactionsHistory.length; i++) {
            const transaction = sender.transactionsHistory[i];
            if (
              transaction.transactionId.toString() ==
              item.transactionId.toString()
            ) {
              if (transaction.categoryId != "null") {
                const categoryItem = await categoryModel.findOne({
                  _id: transaction.categoryId,
                });
                categoryItem.amount += item.amount;
                await categoryItem.save();
              }
              transaction.status = true;
            }
          }
          await sender.save();
          //#endregion

          //#region update user history
          user.transactionsHistory.unshift({
            userId: item.sender,
            amount: item.amount,
            status: true,
            title: item.title,
            transactionId,
            fromCard: item.fromCard,
          });

          const senderCard = await cardModel.findOne({ _id: item.fromCard });
          if (senderCard.limit.isActive) {
            senderCard.limit.amount += Math.abs(item.amount);
          }
          await senderCard.save();

          transactionsList.transactions.splice(i, 1);
          //#endregion
          categoryItem.amount += item.amount;
        }
      }

      await transactionsList.save();
      await categoryItem.save();
      await user.save();
      await card.save();

      return res.status(200).json({ message: "Qəbul edildi" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

router.put("/reject/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const transactionId = req.params.id;
    let senderId;

    const transactionsList = await transactionModel.findOne(
      { userId },
      "transactions"
    );

    const user = await userModel.findOne(
      { _id: userId },
      "transactionsHistory"
    );

    for (let i = 0; i < transactionsList.transactions.length; i++) {
      const item = transactionsList.transactions[i];
      if (item._id.toString() == transactionId) {
        senderId = item.sender;

        const sender = await userModel.findOne(
          { _id: senderId },
          "transactionsHistory"
        );

        for (let i = 0; i < sender.transactionsHistory.length; i++) {
          const transactionItem = sender.transactionsHistory[i];
          if (
            transactionItem.transactionId.toString() ==
            item.transactionId.toString()
          ) {
            transactionItem.status = false;
            const card = await cardModel.findOne({
              _id: transactionItem.fromCard,
            });
            card.cardBalance += Math.abs(transactionItem.amount);
            await card.save();
          }
        }

        user.transactionsHistory.unshift({
          userId: item.sender,
          amount: item.amount,
          status: false,
          title: item.title,
          transactionId,
          fromCard: item.fromCard,
        });

        await sender.save();
        transactionsList.transactions.splice(i, 1);
      }
    }

    await user.save();
    await transactionsList.save();

    return res.status(200).json({ message: "İmtina edildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/get-pendings", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const history = await transactionModel.findOne({ userId }, "-_id");

    if (!history || !history.transactions.length)
      return res.status(200).json({ data: [] });

    const idList = history.transactions.map((item) => {
      return item.sender;
    });

    const userList = await userModel.find(
      { _id: { $in: idList } },
      "email name surname profile_photo"
    );

    const sortedUserList = idList.map((id) =>
      userList.find((user) => user._id.toString() === id.toString())
    );

    const data = [];

    for (let i = 0; i < history.transactions.length; i++) {
      const transactionItem = history.transactions[i];
      const userItem = sortedUserList[i];

      data.push({
        _id: transactionItem._id,
        status: transactionItem.isRecieve,
        amount: transactionItem.amount,
        date: transactionItem.date,
        title: transactionItem.title,
        email: userItem.email,
        sender: userItem.name + " " + userItem.surname,
        profile_photo: userItem.profile_photo,
      });
    }

    return res.status(200).json({ data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

function getDayName(dayOfWeek) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayOfWeek];
}

router.get("/last-week", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const { endDate, startDate } = getLastWeekDates();

    const transactions = await userModel.findOne({
      _id: userId,
      "transactionsHistory.date": { $gte: startDate, $lt: endDate },
    });

    const weeklyIncome = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    const weeklyExpense = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    if (!transactions)
      return res.status(200).json({ data: { weeklyIncome, weeklyExpense } });

    transactions.transactionsHistory.forEach((transaction) => {
      const dayOfWeek = new Date(transaction.date).getDay();
      const dayName = getDayName(dayOfWeek);
      if (transaction.amount > 0) {
        weeklyIncome[dayName].push(transaction);
      } else {
        weeklyExpense[dayName].push(transaction);
      }
    });

    return res.status(200).json({
      data: { weeklyIncome, weeklyExpense },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/last-transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
