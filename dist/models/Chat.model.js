import mongoose, { Schema } from "mongoose";
const ChatSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model("Chat", ChatSchema);
