import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";

import { authenticateToken } from "../utils/jwt.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "Sizin hesabınız mövcuddur" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      surname,
      email,
      password: hashedPassword,
    });

    return res.status(200).json({ message: "Hesabınız yaradıldı" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "istifadəçi mövcud deyil" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Məlumat(lar) yanlışdır." });
    }

    const accessToken = jwt.sign({ user: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    const refreshToken = jwt.sign({ user: user._id }, process.env.REFRESH_KEY, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      data: { accessToken: accessToken, refreshToken: refreshToken },
      message: "Xoş gəldiniz!",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const { password, newPassword } = req.body;

    const user = await User.findById(userId, "password");

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Cari şifrə yanlışdır." });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;

    await user.save();

    return res.status(200).json({ message: "Şifrə uğurla dəyişdirildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/infoes", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const user = await User.findOne(
      { _id: userId },
      "-_id totalBalance incomeCategories outcomeCategories"
    );

    return res.status(200).json({ data: user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
