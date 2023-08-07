import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";

import { initializeSocketIO } from "./socketHandler.js";

//Route
import userRouter from "./routers/userRouter.js";
import cardRouter from "./routers/cardRouter.js";
import transactionRouter from "./routers/transactionRouter.js";
import contactsRouter from "./routers/contactsRouter.js";
import categoriesRouter from "./routers/categoriesRouter.js";
import uploadImage from "./uploadImage.js";
import { authenticateToken } from "./utils/jwt.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb" }));
app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   const now = new Date();
//   const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
//   const userAgent = req.get("User-Agent");

//   // console.log(`[${now.toISOString()}] - IP: ${ip}, User-Agent: ${userAgent}`);

//   next();
// });

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   next();
// });

app.use("/api/user", userRouter);
app.use("/api/cards", cardRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/categories", categoriesRouter);

app.post("/uploadImage", authenticateToken, async (req, res) => {
  console.log("okay");
  uploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((err) => res.status(500).send(err));
});

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
  initializeSocketIO(server);

  mongoose
    .connect(process.env.DB_CONNECTION_STRING)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
});
