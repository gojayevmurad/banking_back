// socketHandler.js
import { Server } from "socket.io";
import { authenticateTokenSocket } from "./utils/jwt.js";
import {
  readMessage,
  saveMessage,
} from "./controllers/socket/chatController.js";
import { changeStatus } from "./controllers/socket/userController.js";

export const initializeSocketIO = (server) => {
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

    socket.on("send_message", async (data) => {
      const { message, recipientId } = data;
      try {
        const savedMessage = await saveMessage(
          socket.userId,
          recipientId,
          message
        );

        io.to(recipientId).emit("receive_message", {
          message: savedMessage.content,
          userId: socket.userId,
        });

        io.to(recipientId).emit("notification", {
          message: savedMessage.content,
          sender_photo: savedMessage.sender_photo,
          sender: savedMessage.sender,
        });
      } catch (err) {
        console.log("error", err);
      }
    });

    socket.on("set_online", async () => {
      await changeStatus(socket.userId, true);
    });

    socket.on("set_offline", async () => {
      await changeStatus(socket.userId, false);
    });

    socket.on("readed", async (data) => {
      const { connectionId } = data;

      await readMessage(socket.userId, connectionId);

      io.to(connectionId).emit("readed", { id: socket.userId });
    });
  });
};
