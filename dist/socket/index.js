import { Server } from "socket.io";
import { socketAuth } from "../uttils/socketAuth.js";
import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";
let io;
// Map to store online users: userId -> Set of socketIds
const userSocketMap = new Map();
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        const user = socketAuth(token);
        if (!user) {
            return next(new Error("Invalid token"));
        }
        socket.userId = user.id;
        next();
    });
    io.on("connection", async (socket) => {
        const userId = socket.userId;
        console.log("User connected:", userId);
        // Handle Online Status
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)?.add(socket.id);
        // If this is the first connection for this user, mark as online in DB
        if (userSocketMap.get(userId)?.size === 1) {
            await User.findByIdAndUpdate(userId, { isOnline: true });
        }
        // Broadcast online users
        io.emit("get_online_users", Array.from(userSocketMap.keys()));
        /**
         * Join user personal room
         */
        socket.join(userId);
        /**
         * Join Chat Room
         */
        socket.on("join_chat", (chatId) => {
            socket.join(chatId);
            console.log(`User ${userId} joined chat ${chatId}`);
        });
        /**
         * Typing Indicator
         */
        socket.on("typing", (chatId) => {
            socket.to(chatId).emit("typing", {
                chatId,
                userId: userId,
            });
        });
        socket.on("stop_typing", (chatId) => {
            socket.to(chatId).emit("stop_typing", {
                chatId,
                userId: userId,
            });
        });
        /**
         * Send Message (Real-time)
         */
        socket.on("send_message", async ({ chatId, messageType, text, mediaUrl, fileName, fileSize, linkPreview, }) => {
            try {
                const message = await Message.create({
                    chatId: new mongoose.Types.ObjectId(chatId),
                    senderId: new mongoose.Types.ObjectId(userId),
                    messageType,
                    text,
                    mediaUrl,
                    fileName,
                    fileSize,
                    linkPreview,
                    readBy: [new mongoose.Types.ObjectId(userId)],
                });
                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: message._id,
                });
                io.to(chatId).emit("new_message", message);
            }
            catch (error) {
                console.error("Message send error:", error);
            }
        });
        /**
         * Message Read
         */
        socket.on("message_read", async ({ messageId }) => {
            await Message.findByIdAndUpdate(messageId, {
                $addToSet: { readBy: new mongoose.Types.ObjectId(userId) },
            });
        });
        /**
         * Disconnect
         */
        socket.on("disconnect", async () => {
            console.log("User disconnected:", userId);
            // Remove socket from map
            const userSockets = userSocketMap.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    userSocketMap.delete(userId);
                    // Mark as offline in DB and update lastSeen
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: new Date()
                    });
                }
            }
            // Broadcast online users
            io.emit("get_online_users", Array.from(userSocketMap.keys()));
        });
    });
    return io;
};
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
