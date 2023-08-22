import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authenticateToken } from "../utils/jwt.js";

import User from "../models/userModel.js";
import cardModel from "../models/cardModel.js";
import temporaryUser from "../models/temporaryUser.js";
import { sendMail } from "../emailConfig.js";
import { MailTemplates } from "../constants/mailTemplates.js";
import { UAParser } from "ua-parser-js";

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
      profile_photo:
        "https://icon-library.com/images/default-user-icon/default-user-icon-9.jpg",
    });

    const OTP = Math.floor(100000 + Math.random() * 900000);

    await temporaryUser.create({
      email,
      OTP,
    });

    const mailTemplate = new MailTemplates();
    mailTemplate.setOTP(OTP);

    sendMail(email, mailTemplate.getOtpMailTemplate());

    return res
      .status(200)
      .json({ message: "Email ünvanınıza təsdiqləmə mesajı göndərildi" });
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
      return res.status(400).json({ message: "Məlumat yanlışdır." });
    }

    if (!user.verified) {
      return res.status(403).json({
        message: "Email ünvanınızı təsdiq edin",
        data: { email: user.email },
      });
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
      "-transactionsHistory -password -__v -createdAt -updatedAt -contacts"
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

router.put("/change-notification", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    const user = await User.findOne({ _id: userId });

    user.showNotification = !user.showNotification;

    await user.save();

    return res.status(200).json({ message: "Dəyişdirildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put("/verify", async (req, res) => {
  try {
    const { email, OTP } = req.body;

    const temporaryUserItem = await temporaryUser.findOne({ email });

    const isValidOTP = temporaryUserItem.OTP == OTP;

    if (!isValidOTP) {
      return res.status(400).json({ message: "OTP yanlışdır" });
    }

    await temporaryUserItem.deleteOne();

    const user = await User.findOne({ email }, "verified");

    user.verified = true;

    await user.save();

    return res.status(200).json({ message: "Email addresiniz təsdiq edildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/validuser/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isValid = await User.exists({ _id: id });

    if (!isValid) {
      return res.status(500).json({ message: "Xəta" });
    }

    return res.status(200).json({ data: true });
  } catch (err) {
    return res.status(500).json({ message: "Xəta" });
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const { id, token, password } = req.body;

    const userExist = await User.findOne(
      { _id: id },
      "forgotPasswordToken password"
    );

    if (!userExist) {
      return res.status(404).json({ message: "Tapılmadı" });
    }

    const isValidToken = jwt.verify(
      token,
      process.env.SECRET_KEY,
      (err, data) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return {
              message: "Url vaxtı bitib",
              status: false,
            };
          } else {
            throw err;
          }
        }
        return true;
      }
    );

    const isTokenEqual = token == userExist.forgotPasswordToken;

    if (isValidToken?.message) {
      return res.status(400).json({ message: isValidToken.message });
    }

    if (!isTokenEqual) {
      return res.status(400).json({ message: "Təsdiq edilmədi" });
    }

    const newPassword = await bcrypt.hash(password, 10);

    userExist.password = newPassword;

    await userExist.save();

    return res.status(200).json({ message: "Şifrə yeniləndi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post("/send-recovery-email", async (req, res) => {
  try {
    const { email } = req.body;

    const userExist = await User.findOne({ email });

    if (!userExist) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const token = jwt.sign({ _id: userExist._id }, process.env.SECRET_KEY, {
      expiresIn: "3m",
    });

    userExist.forgotPasswordToken = token;

    await userExist.save();

    const recoveryUrl = `http://localhost:3000/reset-password/${userExist._id}/${token}`;

    const mailTemplate = new MailTemplates();

    const userAgent = req.headers["user-agent"];

    const parser = new UAParser();
    const result = parser.setUA(userAgent).getResult();

    const operatingSystem = result.os.name;
    const browserName = result.browser.name;

    mailTemplate.setMainData({
      userName: userExist.name + " " + userExist.surname,
      browser_name: browserName,
      operating_system: operatingSystem,
      support_url: "http://localhost:3000",
      action_url: recoveryUrl,
    });

    sendMail(email, mailTemplate.getRecoveryMailTemplate());

    return res.status(200).json({ message: "Bərpa emaili göndərildi" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
