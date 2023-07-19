import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import userRouter from "./routers/userRouter.js";
import cardRouter from "./routers/cardRouter.js";
import transactionRouter from "./routers/transactionRouter.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/user", userRouter);
app.use("/api/cards", cardRouter);
app.use("/api/transaction", transactionRouter);

app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.DB_CONNECTION_STRING)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
});
