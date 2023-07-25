import express from "express";

import notificationModel from "../models/notificationModel.js";
import { authenticateToken } from "../utils/jwt.js";

const router = express.Router();

router.get("/get-notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.data.user;

    
    
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
