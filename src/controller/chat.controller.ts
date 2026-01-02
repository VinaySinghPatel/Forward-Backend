import { Response } from "express";
import Chat from "../models/Chat.model.js";
import User from "../models/User.model.js";
import Message, { IMessage } from "../models/Message.model.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { getIO } from "../socket/index.js";

/**
 * Create or Get One-to-One Chat
 */
export const createOrGetChat = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        let { userId, phoneNumber } = req.body;
        const myId = req.user.id;

        if (phoneNumber) {
            const user = await User.findOne({ phoneNumber });
            if (!user) {
                return res.status(404).json({ message: "User not found with this phone number" });
            }
            userId = user._id;
        }

        if (!userId) {
            return res.status(400).json({ message: "UserId or PhoneNumber is required" });
        }

        // Check if trying to chat with self
        if (userId.toString() === myId.toString()) {
            return res.status(400).json({ message: "Cannot create chat with yourself" });
        }

        let chat = await Chat.findOne({
            isGroupChat: false,
            participants: { $all: [myId, userId] },
        }).populate("participants", "name avatar lastSeen"); // Populate immediately for frontend

        if (!chat) {
            chat = await Chat.create({
                participants: [myId, userId],
            });
            // Populate the new chat
            chat = await chat.populate("participants", "name avatar lastSeen");

            // Notify the other user
            const io = getIO();
            io.to(userId.toString()).emit("new_chat", chat);
        }

        res.json(chat);
    } catch (error) {
        console.error("Create Chat Error:", error);
        res.status(500).json({ message: "Chat creation failed" });
    }
};

/**
 * Get My Chats
 */
export const getMyChats = async (req: AuthRequest, res: Response) => {
    try {
        const chats = await Chat.find({
            participants: req.user.id,
        })
            .populate("participants", "name avatar lastSeen")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })
            .lean(); // Use lean to modify the object

        // Calculate unread counts for each chat
        const chatsWithUnread = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await Message.countDocuments({
                    chatId: chat._id,
                    readBy: { $ne: req.user.id }, // Messages NOT read by user
                });
                return { ...chat, unreadCount };
            })
        );

        res.json(chatsWithUnread);
    } catch (error) {
        console.error("Get Chats Error:", error);
        res.status(500).json({ message: "Failed to fetch chats" });
    }
};

/**
 * Get Messages of a Chat
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const messages = await Message.find({
            chatId: req.params.chatId,
        }).populate("senderId", "name avatar");

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch messages" });
    }
};

/**
 * Send Message (Text / Media / Link)
 */
export const sendMessage = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { chatId, messageType, text, linkPreview } = req.body;

        const messageData: any = {
            chatId,
            senderId: req.user.id,
            messageType,
            text,
            linkPreview,
            readBy: [req.user.id], // Sender has read the message
        };

        if (req.file) {
            messageData.mediaUrl = `/uploads/${req.file.filename}`;
            messageData.fileName = req.file.originalname;
            messageData.fileSize = req.file.size;
        }

        const message = (await Message.create(messageData)) as unknown as IMessage;

        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
        });

        // Real-time update via Socket.io
        const io = getIO();
        io.to(chatId).emit("new_message", message);

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: "Message send failed" });
    }
};

/**
 * Mark Messages as Read
 */
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { chatId } = req.body;
        if (!chatId) return res.status(400).json({ message: "ChatId required" });

        await Message.updateMany(
            { chatId, readBy: { $ne: req.user.id } },
            { $addToSet: { readBy: req.user.id } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: "Failed to mark messages as read" });
    }
};
