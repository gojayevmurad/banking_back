import express from "express";

import Card from "../models/cardModel.js";
import cardDesigns from "../constants/cardDesigns.js";
import { authenticateToken } from "../utils/jwt.js";

const router = express.Router();

router.post("/new-card", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const date = new Date();
    const { cardName, holderName, year, cardType, cardDesign } = req.body;

    const cvc = Math.floor(Math.random() * 999);
    let cardNumber = 1234;

    let i = 0;
    for (i; i < 3; i++) {
      cardNumber *= 10000;
      cardNumber += Math.floor(Math.random() * 9999);
    }

    // Valid thru
    const validThru =
      date.getMonth() + 1 + "/" + ((date.getFullYear() % 1000) + year);

    await Card.create({
      userId,
      cardName,
      holderName,
      validThru,
      cardType,
      cvc,
      cardNumber,
      ...cardDesigns[cardDesign],
    });

    const cards = await Card.find({ userId }, "-userId -__v");

    return res
      .status(200)
      .json({ data: cards, message: "Kart hesabınıza əlavə olundu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/get", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const cards = await Card.find({ userId }, "-userId -__v");

    return res.status(200).json({ data: cards });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/change-status/:id", authenticateToken, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.data.user;

    const currentCard = await Card.findOne({ _id: cardId, userId }, "status");
    currentCard.status = !currentCard.status;
    await currentCard.save();

    const cardList = await Card.find({ userId }, "-userId -__v");

    return res
      .status(200)
      .json({ message: "Uğurlu əməliyyat", data: cardList });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/change-limit/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const cardId = req.params.id;

    const currentCard = await Card.findOne({ _id: cardId, userId });

    currentCard.limit.isActive = !currentCard.limit.isActive;

    await currentCard.save();

    const cardList = await Card.find({ userId }, "-userId -__v");

    return res
      .status(200)
      .json({ message: "Uğurlu əməliyyat", data: cardList });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
