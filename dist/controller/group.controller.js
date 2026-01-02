import Chat from "../models/Chat.model.js";
import { getIO } from "../socket/index.js";
export const createGroup = async (req, res) => {
    try {
        const { groupName, members } = req.body;
        const userId = req.user.id;
        // Start with the creator
        const participants = [userId];
        // Add selected members if provided
        if (members && Array.isArray(members)) {
            // Filter out the creator if accidentally included and duplicates
            const uniqueMembers = [...new Set(members)].filter(id => id !== userId);
            participants.push(...uniqueMembers);
        }
        const group = await Chat.create({
            isGroupChat: true,
            groupName,
            groupAdmin: userId,
            participants: participants,
        });
        // Populate for immediate return to frontend
        await group.populate("participants", "name avatar");
        // Notify all members (except creator who gets the response directly)
        const io = getIO();
        group.participants.forEach((participant) => {
            if (participant._id.toString() !== userId) {
                io.to(participant._id.toString()).emit("added_to_group", group);
            }
        });
        res.status(201).json(group);
    }
    catch (error) {
        console.error("Group creation error:", error);
        res.status(500).json({ message: "Group creation failed" });
    }
};
export const requestToJoinGroup = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userId = req.user.id;
        const group = await Chat.findById(groupId);
        if (!group || !group.isGroupChat) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (group.participants.includes(userId)) {
            return res.status(400).json({ message: "Already a member" });
        }
        if (group.joinRequests.includes(userId)) {
            return res.status(400).json({ message: "Request already sent" });
        }
        group.joinRequests.push(userId);
        await group.save();
        // Notify Group Admin
        const io = getIO();
        if (group.groupAdmin) {
            io.to(group.groupAdmin.toString()).emit("group_request", {
                groupId,
                userId,
                groupName: group.groupName,
            });
        }
        res.json({ message: "Join request sent" });
    }
    catch (error) {
        res.status(500).json({ message: "Request failed" });
    }
};
export const handleJoinRequest = async (req, res) => {
    try {
        const { groupId, userId, action } = req.body;
        const adminId = req.user.id;
        const group = await Chat.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (group.groupAdmin?.toString() !== adminId) {
            return res.status(403).json({ message: "Only host can manage requests" });
        }
        if (!group.joinRequests.includes(userId)) {
            return res.status(400).json({ message: "No such request" });
        }
        // Remove from request list
        group.joinRequests = group.joinRequests.filter((id) => id.toString() !== userId);
        if (action === "accept") {
            group.participants.push(userId);
        }
        await group.save();
        // Notify User
        const io = getIO();
        io.to(userId).emit("request_handled", {
            groupId,
            status: action === "accept" ? "accepted" : "rejected",
            groupName: group.groupName,
        });
        if (action === "accept") {
            // Populate and send the full group so they can add it to their list immediately
            await group.populate("participants", "name avatar");
            await group.populate("groupAdmin", "name avatar");
            io.to(userId).emit("added_to_group", group);
        }
        res.json({ message: `Request ${action}ed successfully` });
    }
    catch (error) {
        res.status(500).json({ message: "Action failed" });
    }
};
export const addMemberByHost = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user.id;
        const group = await Chat.findById(groupId);
        if (!group)
            return res.status(404).json({ message: "Group not found" });
        if (group.groupAdmin?.toString() !== adminId) {
            return res.status(403).json({ message: "Only host can add members" });
        }
        if (group.participants.includes(userId)) {
            return res.status(400).json({ message: "User already in group" });
        }
        group.participants.push(userId);
        await group.save();
        // Populate for socket emission
        await group.populate("participants", "name avatar");
        await group.populate("groupAdmin", "name avatar");
        // Notify User
        const io = getIO();
        io.to(userId).emit("added_to_group", group);
        res.json({ message: "Member added successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to add member" });
    }
};
export const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Chat.findById(groupId)
            .populate("participants", "-password -emailOtp -emailOtpExpires -googleId")
            .populate("groupAdmin", "name avatar email");
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        res.json(group);
    }
    catch (error) {
        console.error("Get Group Details Error:", error);
        res.status(500).json({ message: "Failed to fetch group details" });
    }
};
export const getAllPublicGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find groups where the user is NOT a participant
        const groups = await Chat.find({
            isGroupChat: true,
            participants: { $ne: userId }
        })
            .populate("participants", "name avatar") // To show member count/names
            .populate("groupAdmin", "name");
        res.json(groups);
    }
    catch (error) {
        console.error("Get All Public Groups Error:", error);
        res.status(500).json({ message: "Failed to fetch groups" });
    }
};
export const getMyGroupRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const groups = await Chat.find({
            groupAdmin: userId,
            isGroupChat: true,
            joinRequests: { $not: { $size: 0 } } // Only groups with requests
        })
            .populate("joinRequests", "name avatar"); // Populate requester details
        res.json(groups);
    }
    catch (error) {
        console.error("Get My Group Requests Error:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
};
export const updateGroupImage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }
        const group = await Chat.findById(groupId);
        if (!group)
            return res.status(404).json({ message: "Group not found" });
        if (group.groupAdmin?.toString() !== adminId) {
            return res.status(403).json({ message: "Only admin can update group image" });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        group.groupImage = imageUrl;
        await group.save();
        // Populate for socket emission
        // We need to re-fetch or populate the document to return full details
        await group.populate("participants", "name avatar");
        await group.populate("groupAdmin", "name avatar");
        // Notify All Participants
        const io = getIO();
        group.participants.forEach((p) => {
            io.to(p._id.toString()).emit("group_updated", group);
        });
        res.json(group);
    }
    catch (error) {
        console.error("Update group image error:", error);
        res.status(500).json({ message: "Failed to update group image" });
    }
};
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userId = req.user.id;
        const group = await Chat.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (!group.participants.includes(userId)) {
            return res.status(400).json({ message: "You are not a member of this group" });
        }
        // Remove user
        group.participants = group.participants.filter((id) => id.toString() !== userId);
        // Handle Admin Logic
        if (group.groupAdmin?.toString() === userId) {
            if (group.participants.length > 0) {
                group.groupAdmin = group.participants[0]; // Promote first member
            }
            else {
                // No members left, delete the group
                await Chat.findByIdAndDelete(groupId);
                return res.json({ message: "Group deleted as you were the last member" });
            }
        }
        await group.save();
        // Populate for socket emission
        await group.populate("participants", "name avatar");
        // Notify remaining members
        const io = getIO();
        group.participants.forEach((p) => {
            io.to(p._id.toString()).emit("user_left_group", { groupId, userId });
        });
        res.json({ message: "Left group successfully" });
    }
    catch (error) {
        console.error("Leave Group Error:", error);
        res.status(500).json({ message: "Failed to leave group" });
    }
};
