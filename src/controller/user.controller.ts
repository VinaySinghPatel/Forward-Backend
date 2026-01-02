import { Response } from "express";
import User from "../models/User.model.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const getUserDetails = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select("-password -emailOtp -emailOtpExpires -googleId");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get user details error:", error);
        res.status(500).json({ message: "Failed to fetch user details" });
    }
};

export const updateProfilePic = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const userId = req.user.id;
        const avatarUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl },
            { new: true }
        ).select("-password -emailOtp -emailOtpExpires -googleId");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Update profile pic error:", error);
        res.status(500).json({ message: "Failed to update profile picture" });
    }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userIdToBlock } = req.body;
        const userId = req.user.id;

        if (userId === userIdToBlock) {
            return res.status(400).json({ message: "You cannot block yourself" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { blockedUsers: userIdToBlock } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User blocked successfully", blockedUsers: user.blockedUsers });
    } catch (error) {
        console.error("Block user error:", error);
        res.status(500).json({ message: "Failed to block user" });
    }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userIdToUnblock } = req.body;
        const userId = req.user.id;

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { blockedUsers: userIdToUnblock } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User unblocked successfully", blockedUsers: user.blockedUsers });
    } catch (error) {
        console.error("Unblock user error:", error);
        res.status(500).json({ message: "Failed to unblock user" });
    }
};
