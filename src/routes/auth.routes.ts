import { Router } from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  verifyOtp,
} from "../controller/auth.controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);



router.post("/verify-otp", verifyOtp);


export default router;
