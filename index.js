import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import UAParser from "ua-parser-js";

import { initializeSocketIO } from "./socketHandler.js";

//Route
import userRouter from "./routers/userRouter.js";
import cardRouter from "./routers/cardRouter.js";
import transactionRouter from "./routers/transactionRouter.js";
import contactsRouter from "./routers/contactsRouter.js";
import categoriesRouter from "./routers/categoriesRouter.js";
import messagesRouter from "./routers/messagesRouter.js";
import uploadImage from "./uploadImage.js";
import { authenticateToken } from "./utils/jwt.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.json());
app.use(cors());


app.use("/api/user", userRouter);
app.use("/api/cards", cardRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/messages", messagesRouter);

app.post("/uploadImage", authenticateToken, async (req, res) => {
  try {
    const url = await uploadImage(req.body.image);

    return res.send(url);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
  initializeSocketIO(server);

  mongoose
    .connect(process.env.DB_CONNECTION_STRING)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
});
