import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

//Route
import userRouter from "./routers/userRouter.js";
import cardRouter from "./routers/cardRouter.js";
import transactionRouter from "./routers/transactionRouter.js";
import contactsRouter from "./routers/contactsRouter.js";
import { authenticateToken, authenticateTokenSocket } from "./utils/jwt.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/user", userRouter);
app.use("/api/cards", cardRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/contacts", contactsRouter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    const { user: userId } = authenticateTokenSocket(token);
    socket.userId = userId;

    next();
  } catch (err) {
    return next(new Error("Authentication failed."));
  }
});

io.on("connection", (socket) => {
  socket.join(socket.userId);

  socket.on("send_message", (data) => {
    const { message, recepientId } = data;

    io.to(recepientId).emit("receive_message", {
      message,
      userId: socket.userId,
    });
  });
});

server.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.DB_CONNECTION_STRING)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
});
