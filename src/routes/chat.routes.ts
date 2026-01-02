import { Router } from "express";
import {
  createOrGetChat,
  getMyChats,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../controller/chat.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../uttils/fileUpload.js";

const router = Router();

router.post("/", authMiddleware, createOrGetChat);
router.get("/", authMiddleware, getMyChats);
router.get("/:chatId/messages", authMiddleware, getMessages);
router.put("/read", authMiddleware, markMessagesAsRead);

router.post(
  "/message",
  authMiddleware,
  upload.single("file"), // image / audio / file
  sendMessage
);

export default router;
