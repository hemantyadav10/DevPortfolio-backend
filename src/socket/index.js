import cookie from "cookie";
import { ApiError } from "../utils/apiError.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";
import { io } from "../app.js";

// Socket.IO middleware for authenticating users
const socketAuth = async (socket, next) => {
  try {
    // Parse cookies from handshake headers
    const cookies = cookie.parse(socket.handshake.headers?.cookie || '');
    let token = cookies?.accessToken || socket.handshake.auth?.token;

    if (!token) {
      throw new ApiError(401, 'UnAuthorized handshake.Token is missing.');
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid access token", error);
    }

    const { _id } = decodedToken;
    const user = await User.findById(_id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Unauthorized handshake. Token is invalid");
    }

    // Attach user to socket object
    socket.user = user;
    next();

  } catch (error) {
    next(new ApiError(500, "Internal server error during socket authentication", error));
  }
}

// Initialize socket event listeners
const initializeSocketIO = () => {
  return (
    io.on('connection', (socket) => {
      try {
        const user = socket.user;
        console.log("🔌 User connected:", user.username, "| socketId:", socket.id);

        // Join user to a room named after their userId 
        socket.join(user._id.toString());

        // Socket disconnect
        socket.on('disconnect', (reason) => {
          console.log("❌ User disconnected:", user?.username, "| reason:", reason);
          if (user?._id) {
            socket.leave(user._id);
          }
        });

      } catch (error) {
        socket.emit(
          'socketError',
          error?.message || "Something went wrong while connecting to the socket."
        );
      }
    })
  );
}

export {
  initializeSocketIO,
  socketAuth
}