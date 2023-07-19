import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

    return res.status(200).json({ message: "Kart hesabınıza əlavə olundu" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/get", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const cards = await Card.find({ userId }, "-_id -userId -__v");

    return res.status(200).json({ data: cards });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
