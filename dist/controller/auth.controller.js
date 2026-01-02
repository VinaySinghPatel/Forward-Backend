import User from "../models/User.model.js";
import { hashPassword, comparePassword } from "../uttils/passwordHash.js";
import { generateToken } from "../uttils/jwt.js";
import { generateOtp } from "../uttils/otp.js";
import { sendOtpEmail } from "../uttils/email.js";
/**
 * Register User (Normal Login)
 */
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        const exists = await User.findOne({
            $or: [{ email }, { phoneNumber }],
        });
        if (exists) {
            return res.status(400).json({
                message: "Email or phone number already exists",
            });
        }
        const hashedPassword = await hashPassword(password);
        const otp = generateOtp();
        await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            emailOtp: otp,
            emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        });
        await sendOtpEmail(email, otp);
        res.status(201).json({
            message: "User registered. OTP sent to email.",
        });
    }
    catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ message: "Registration failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
/**
 * Login User (Normal Login)
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken({ id: user._id, email: user.email });
        res.json({
            message: "Login successful",
            token,
            user,
        });
    }
    catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
/**
 * Google Login
 */
export const googleLogin = async (req, res) => {
    try {
        const { email, name, googleId, avatar } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar,
            });
        }
        const token = generateToken({ id: user._id, email: user.email });
        res.json({
            message: "Google login successful",
            token,
            user,
        });
    }
    catch (error) {
        console.error("Error in googleLogin:", error);
        res.status(500).json({ message: "Google login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.emailOtp) {
            return res.status(400).json({ message: "Invalid request" });
        }
        if (user.emailOtp !== otp ||
            !user.emailOtpExpires ||
            user.emailOtpExpires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        user.isPhoneVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
        await user.save();
        res.json({ message: "Account verified successfully" });
    }
    catch (error) {
        console.error("Error in verifyOtp:", error);
        res.status(500).json({ message: "OTP verification failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
};
