import { Content } from "../models/content.model.js"; // Import the Content model
import { ApiError } from "../utils/ApiError.js"; // Custom error class for API errors
import { ApiResponse } from "../utils/ApiResponse.js"; // Custom response class for API responses
import { asyncHandler } from "../utils/asynchandler.js"; // Utility function to handle async errors

/**
 * Controller to get all content for a specific project
 */
const getAllContent = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Get the projectId from the request parameters
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get the user's role in the project

    // Check if the user has the necessary permissions
    if (!['owner', 'editor', 'member'].includes(userRole)) {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const content = await Content.find({ projectId }); // Find all content for the given project
    res.status(200).json(new ApiResponse(200, content, "All Content Fetched Successfully")); // Send the response
});

/**
 * Controller to create new content for a specific project
 */
const createContent = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Get the projectId from the request parameters
    const { type } = req.body; // Get the content type from the request body
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get the user's role in the project

    // Check if the user has the necessary permissions
    if (userRole !== 'owner' && userRole !== 'editor') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const content = await Content.create({ projectId, type }); // Create new content
    res.status(201).json(new ApiResponse(201, content, "Content Created Successfully")); // Send the response
});

/**
 * Controller to get specific content by its ID for a specific project
 */
const getContentById = asyncHandler(async (req, res) => {
    const { contentId, projectId } = req.params; // Get the contentId and projectId from the request parameters
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get the user's role in the project

    // Check if the user has the necessary permissions
    if (!['owner', 'editor', 'member'].includes(userRole)) {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const content = await Content.findById(contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    res.status(200).json(new ApiResponse(200, content, "Content Fetched Successfully")); // Send the response
});

/**
 * Controller to update specific content by its ID for a specific project
 */
const updateContent = asyncHandler(async (req, res) => {
    const { contentId, projectId } = req.params; // Get the contentId and projectId from the request parameters
    const { type } = req.body; // Get the new content type from the request body
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get the user's role in the project

    // Check if the user has the necessary permissions
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const content = await Content.findByIdAndUpdate(contentId, { type }, { new: true }); // Update the content
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    res.status(200).json(new ApiResponse(200, content, "Content Updated Successfully")); // Send the response
});

/**
 * Controller to delete specific content by its ID for a specific project
 */
const deleteContent = asyncHandler(async (req, res) => {
    const { contentId, projectId } = req.params; // Get the contentId and projectId from the request parameters
    const userRole = req.user.projectRoles.get(projectId.toString()); // Get the user's role in the project

    // Check if the user has the necessary permissions
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const content = await Content.findByIdAndRemove(contentId); // Remove the content
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    res.status(200).json(new ApiResponse(200, {}, "Content Removed Successfully")); // Send the response
});

export default { getAllContent, createContent, getContentById, updateContent, deleteContent }; // Export the controllers

/*
asyncHandler: A utility function to handle asynchronous operations and catch errors. This helps avoid repetitive try-catch blocks in async functions.
req.params: Contains route parameters, used to extract the projectId and contentId from the URL.
req.body: Contains data sent by the client in the request body, such as type in createContent and updateContent.
req.user: Contains the authenticated user's information, including projectRoles which stores the user's roles for different projects.
userRole: Extracts the user's role for the specific project from req.user.projectRoles.
Content.find, Content.create, Content.findById, Content.findByIdAndUpdate, Content.findByIdAndRemove: Mongoose methods to interact with the Content model for fetching, creating, updating, and deleting documents.
ApiError: Custom error class used to throw API-specific errors with appropriate status codes.
ApiResponse: Custom response class used to standardize API responses with a consistent structure.
*/