import { Router } from "express";
import {
  createGroup,
  requestToJoinGroup,
  handleJoinRequest,
  addMemberByHost,
  getGroupDetails,
  getAllPublicGroups,
  getMyGroupRequests,
  updateGroupImage,
  leaveGroup,
} from "../controller/group.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/create", authMiddleware, createGroup);
router.post("/request-join", authMiddleware, requestToJoinGroup);
router.post("/handle-request", authMiddleware, handleJoinRequest);
router.post("/add-member", authMiddleware, addMemberByHost);
router.post("/leave", authMiddleware, leaveGroup);
router.put("/:groupId/image", authMiddleware, upload.single("groupImage"), updateGroupImage);
router.get("/all", authMiddleware, getAllPublicGroups);
router.get("/requests", authMiddleware, getMyGroupRequests);
router.get("/:groupId", authMiddleware, getGroupDetails);

export default router;
