import { Content } from "../models/content.model.js";
import { asyncHandler } from "../utils/asynchandler.js";

const getAllContent = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Extract projectId from params
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get user role for the project

    // Check user's role for permission
    if (!['owner', 'editor', 'member'].includes(userRole)) {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const content = await Content.find({ projectId }); // Find content by projectId
    res.status(200).json(content);
});

const createContent = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { type } = req.body;
    const userRole = req.user.projectRoles.get(projectId.toString());

    // Check user's role for permission
    if (userRole !== 'owner' && userRole !== 'editor') {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const content = await Content.create({ projectId, type });
    res.status(201).json({ msg: "Content Created Successfully", content });
});

const getContentById = asyncHandler(async (req, res) => {
    const { contentId, projectId } = req.params; // Extract contentId and projectId from params
    const userRole = req.user.projectRoles.get(projectId.toString());

    // Check user's role for permission
    if (!['owner', 'editor', 'member'].includes(userRole)) {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const content = await Content.findById(contentId);
    if (!content) {
        return res.status(404).json({ msg: "Content not found" });
    }
    res.status(200).json(content);
});

const updateContent = asyncHandler(async (req, res) => {
    const { contentId } = req.params;
    const { type } = req.body;
    const { projectId } = req.params; // Extract projectId from params
    const userRole = req.user.projectRoles.get(projectId.toString());

    // Check user's role for permission
    if (userRole !== 'owner') {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const content = await Content.findByIdAndUpdate(contentId, { type }, { new: true });
    if (!content) {
        return res.status(404).json({ msg: "Content not found" });
    }

    res.status(200).json({ msg: "Content updated successfully", content });
});

const deleteContent = asyncHandler(async (req, res) => {
    const { contentId, projectId } = req.params; // Extract contentId and projectId from params
    const userRole = req.user.projectRoles.get(projectId.toString());

    // Check user's role for permission
    if (userRole !== 'owner') {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const content = await Content.findByIdAndRemove(contentId);
    if (!content) {
        return res.status(404).json({ msg: "Content not found" });
    }

    res.status(200).json({ msg: "Content removed successfully" });
});

export default { getAllContent, createContent, getContentById, updateContent, deleteContent };
