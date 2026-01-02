import { Router } from "express";
import { getUserDetails, updateProfilePic, blockUser, unblockUser } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/:id", authMiddleware, getUserDetails);
router.put("/profile-pic", authMiddleware, upload.single("avatar"), updateProfilePic);
router.post("/block", authMiddleware, blockUser);
router.post("/unblock", authMiddleware, unblockUser);

export default router;
