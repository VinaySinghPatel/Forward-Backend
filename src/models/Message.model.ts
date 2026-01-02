import mongoose, { Schema, Document, Types } from "mongoose";

export type MessageType = "text" | "image" | "audio" | "file" | "link";

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  messageType: MessageType;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  linkPreview?: string;
  readBy: Types.ObjectId[];
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "file", "link"],
      required: true,
    },
    text: {
      type: String,
    },
    mediaUrl: {
      type: String, // Image / Audio / File URL
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    linkPreview: {
      type: String, // Optional preview or title
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", MessageSchema);
