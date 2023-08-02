import express from "express";

import { authenticateToken } from "../utils/jwt.js";

import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";

const router = express.Router();

router.post("/create", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const { categoryName, isIncome, target, color } = req.body;

    if (isIncome) {
      await categoryModel.create({
        userId,
        categoryName,
        isIncome,
        target,
        color,
      });
    } else {
      await categoryModel.create({
        userId,
        categoryName,
        isIncome,
        color,
      });
    }

    const message = isIncome
      ? "Gəlir kateqoriyası uğurla yaradıldı."
      : "Xərc kateqoriyası uğurla yaradıldı.";

    return res.status(200).json({ message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/income-categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const categories = await categoryModel.find({ userId, isIncome: true });

    return res.status(200).json({ data: categories });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/expense-categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const categories = await categoryModel.find({ userId, isIncome: false });

    return res.status(200).json({ data: categories });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete("/remove-category/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;
    const { id } = req.params;

    const category = await categoryModel.findOne({ _id: id, userId });

    if (!category) {
      return res.status(400).json({ message: "Kateqoriya tapılmadı" });
    }

    await category.deleteOne();

    return res.status(200).json({ message: "Kateqoriya silindi." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
