import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;

  phoneNumber: string;
  isPhoneVerified: boolean;

  emailOtp?: string;
  emailOtpExpires?: Date;

  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;

  blockedUsers: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
    },

    googleId: {
      type: String,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    emailOtp: {
      type: String,
    },

    emailOtpExpires: {
      type: Date,
    },

    avatar: {
      type: String,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);


export default mongoose.model<IUser>("User", UserSchema);
