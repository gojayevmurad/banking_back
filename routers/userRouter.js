import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authenticateToken } from "../utils/jwt.js";
import { cloudinary } from "../utils/cloudinary.js";

import User from "../models/userModel.js";
import cardModel from "../models/cardModel.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: "Sizin hesabınız mövcuddur" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // const imageUploadResult = await cloudinary.uploader.upload(image, {
    //   folder: "profile_photos",
    // });

    await User.create({
      name,
      surname,
      email,
      password: hashedPassword,
      profile_photo:
        "https://icon-library.com/images/default-user-icon/default-user-icon-9.jpg",
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
      "-_id -transactionsHistory -password -__v -createdAt -updatedAt -contacts"
    );

    const cardsList = await cardModel.find({ userId }, "cardBalance -_id");
    const totalBalance = cardsList.reduce(
      (accumulator, currentCard) => accumulator + currentCard.cardBalance,
      0
    );
    return res.status(200).json({ data: { ...user._doc, totalBalance } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/change-profile-photo", authenticateToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const userId = req.data.user;

    const user = await User.findOne(
      { _id: userId },
      " -transactionsHistory -password -__v -createdAt -updatedAt -contacts"
    );

    const cardsList = await cardModel.find({ userId }, "cardBalance -_id");
    const totalBalance = cardsList.reduce(
      (accumulator, currentCard) => accumulator + currentCard.cardBalance,
      0
    );

    user.profile_photo = imageUrl;

    await user.save();

    return res.status(200).json({
      message: "Profil şəkli uğurla dəyişdirildi",
      data: { ...user._doc, totalBalance },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post;

export default router;
