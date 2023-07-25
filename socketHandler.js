// socketHandler.js
import { Server } from "socket.io";
import { authenticateTokenSocket } from "./utils/jwt.js";

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

    socket.on("send_message", (data) => {
      const { message, recepientId } = data;

      io.to(recepientId).emit("receive_message", {
        message,
        userId: socket.userId,
      });
    });
  });
};
