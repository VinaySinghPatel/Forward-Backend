// FOR CONFIGURATION OF THE BACKEND THATS WHY IT IS IN CONFIG FOLDER
import mongoose from "mongoose";
import dotenv from "dotenv";
import { ENV } from "./env.js";
dotenv.config();

export const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
};

//module.exports = connectDB;