import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChat extends Document {
  isGroupChat: boolean;
  groupName?: string;
  groupImage?: string;
  groupAdmin?: Types.ObjectId;

  participants: Types.ObjectId[];
  joinRequests: Types.ObjectId[];

  lastMessage?: Types.ObjectId;
}

const ChatSchema = new Schema<IChat>(
  {
    isGroupChat: {
      type: Boolean,
      default: false,
    },

    groupName: {
      type: String,
    },

    groupImage: {
      type: String, // URL/path to the image
    },

    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    joinRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", ChatSchema);
