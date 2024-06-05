import { asyncHandler } from "../utils/asynchandler.js"; // Import the asyncHandler to manage async functions
import { Version } from "../models/version.model.js"; // Import the Version model
import { Content } from "../models/content.model.js"; // Import the Content model
import { Project } from "../models/project.model.js"; // Import the Project model
import { ApiError } from "../utils/ApiError.js"; // Custom error class for API errors
import { ApiResponse } from "../utils/ApiResponse.js"; // Custom response class for API responses
import multer from "multer"; // Import multer for file uploads
import { uploadOnCloudinary } from "../utils/cloudinary.js"; // Utility function to upload files to Cloudinary

const getAllVersions = asyncHandler(async (req, res) => {
    const {contentId} = req.params
    const content = await Content.findById(contentId)
    const userRole = req.user.projectRoles.get(content.projectId.toString())

    if(!["owner", "editor", "member"].includes(userRole)) {
        throw new ApiError(403, "Permission Denied")
    }

    const versions = await Version.find({contentId})
    res.status(200).json(new ApiResponse(200, versions, "Versions fetched Succesfully"))
})

/**
 * Controller to create a new version of content
 */
const createVersion = asyncHandler(async (req, res) => {
    const { contentId } = req.params; // Get the contentId from the request parameters
    const userId = req.user._id; // Get the userId from the authenticated user

    const fileLocalPath = req.files?.file[0]?.path; // Get the local path of the uploaded file

    const file = await uploadOnCloudinary(fileLocalPath); // Upload the file to Cloudinary

    const content = await Content.findById(contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    const userRole = req.user.projectRoles.get(content.projectId.toString()); // Get the user's role in the project
    if (userRole !== 'editor' && userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const newVersion = await Version.create({
        contentId: contentId,
        uploadedBy: userId,
        filePath: file?.url || "" // Use the file URL from Cloudinary or an empty string
    });

    content.versions.push(newVersion._id); // Add the new version to the content's versions array
    await content.save(); // Save the content

    res.status(201).json(new ApiResponse(201, { newVersion }, "Version created successfully")); // Send the response
});

/**
 * Controller to get a specific version by its ID
 */
const getVersionById = asyncHandler(async (req, res) => {
    const { versionId, contentId } = req.params; // Get the versionId and contentId from the request parameters

    const version = await Version.findById(versionId); // Find the version by its ID
    if (!version) {
        throw new ApiError(404, "Version not found"); // Throw an error if the version is not found
    }

    const content = await Content.findById(contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    const userRole = req.user.projectRoles.get(content.projectId.toString()); // Get the user's role in the project
    if (!['owner', 'editor', 'member'].includes(userRole)) {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    res.status(200).json(new ApiResponse(200, version, "Version fetched successfully")); // Send the response
});

/**
 * Controller to update a specific version by its ID
 */
const updateVersion = asyncHandler(async (req, res) => {
    const { versionId } = req.params; // Get the versionId from the request parameters
    const userId = req.user._id; // Get the userId from the authenticated user

    const fileLocalPath = req.files?.file[0]?.path; // Get the local path of the uploaded file

    const file = await uploadOnCloudinary(fileLocalPath); // Upload the file to Cloudinary

    const version = await Version.findById(versionId); // Find the version by its ID
    if (!version) {
        throw new ApiError(404, "Version not found"); // Throw an error if the version is not found
    }

    const content = await Content.findById(version.contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    const userRole = req.user.projectRoles.get(content.projectId.toString()); // Get the user's role in the project
    if (userRole !== 'owner' && userRole !== 'editor') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    version.uploadedBy = userId; // Update the user who uploaded the version
    version.filePath = file?.url || ""; // Update the file URL
    await version.save(); // Save the version

    res.status(200).json(new ApiResponse(200, { version }, "Version updated successfully")); // Send the response
});

/**
 * Controller to delete a specific version by its ID
 */
const deleteVersion = asyncHandler(async (req, res) => {
    const { versionId } = req.params; // Get the versionId from the request parameters

    const version = await Version.findById(versionId); // Find the version by its ID
    if (!version) {
        throw new ApiError(404, "Version not found"); // Throw an error if the version is not found
    }

    const content = await Content.findById(version.contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    const userRole = req.user.projectRoles.get(content.projectId.toString()); // Get the user's role in the project
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    await version.remove(); // Remove the version
    res.status(200).json(new ApiResponse(200, {}, "Version removed successfully")); // Send the response
});

/**
 * Controller to approve a specific version by its ID
 */
const approveVersion = asyncHandler(async (req, res) => {
    const { versionId } = req.params; // Get the versionId from the request parameters
    const userId = req.user._id; // Get the userId from the authenticated user

    const version = await Version.findById(versionId); // Find the version by its ID
    if (!version) {
        throw new ApiError(404, "Version not found"); // Throw an error if the version is not found
    }

    const content = await Content.findById(version.contentId); // Find the content by its ID
    if (!content) {
        throw new ApiError(404, "Content not found"); // Throw an error if the content is not found
    }

    const project = await Project.findById(content.projectId); // Find the project by its ID
    const userRole = req.user.projectRoles.get(project._id.toString()); // Get the user's role in the project
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied"); // Throw an error if the user doesn't have permission
    }

    const versionIndex = content.versions.indexOf(version._id); // Find the index of the version in the content's versions array
    if (versionIndex > -1) {
        content.versions.splice(versionIndex, 1); // Remove the version from its current position
    }
    content.versions.unshift(version._id); // Add the version to the front

    await Version.updateMany(
        { contentId: content._id },
        { $set: { approved: false } } // Set approved to false for all versions of this content
    );
    version.approved = true; // Mark the version as approved
    await version.save(); // Save the version

    await content.save(); // Save the content

    res.status(200).json(new ApiResponse(200, { version }, "Version approved successfully")); // Send the response
});

export default {
    getAllVersions,
    createVersion,
    getVersionById,
    updateVersion,
    deleteVersion,
    approveVersion
}; // Export the controllers

/*
asyncHandler: A utility function to handle asynchronous operations and catch errors, avoiding repetitive try-catch blocks in async functions.
req.params: Contains route parameters, used to extract contentId, versionId, etc., from the URL.
req.body: Contains data sent by the client in the request body.
req.files: Contains uploaded files, handled by multer.
req.user: Contains the authenticated user's information, including projectRoles which stores the user's roles for different projects.
uploadOnCloudinary: Utility function to upload files to Cloudinary and get the file URL.
Version.create, Version.findById, Version.findByIdAndUpdate, Version.findByIdAndRemove: Mongoose methods to interact with the Version model for creating, fetching, updating, and deleting documents.
Content.findById: Mongoose method to find content by its ID.
ApiError: Custom error class used to throw API-specific errors with appropriate status codes.
ApiResponse: Custom response class used to standardize API responses with a consistent structure. 
*/