import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new project and assign the "owner" role to the creator
const createProject = asyncHandler(async (req, res) => {
    const { projectName, projectDescription } = req.body; // Get project details from request body
    const userId = req.user._id; // Get the user ID from the authenticated user

    // Create a new project with the provided details and assign the user as the owner
    const newProject = await Project.create({
        name: projectName,
        description: projectDescription,
        members: [
            {
                userId: userId,
                role: "owner"
            }
        ]
    });

    // Set the user's role for this project as 'owner' in the user's projectRoles map
    req.user.projectRoles.set(newProject._id.toString(), 'owner');
    await req.user.save(); // Save the user with the updated roles

    // Send a success response with the newly created project
    res.status(201).json(new ApiResponse(201, { project: newProject }, "Project Created Successfully"));
});

// Approve a user to join a project and assign them a role (editor/member)
const approveUser = asyncHandler(async (req, res) => {
    const { requesterId, projectId, role } = req.body; // Get requester ID, project ID, and role from request body
    const userId = req.user._id; // Get the user ID from the authenticated user

    const requester = await User.findById(requesterId); // Find the requester user by ID

    const project = await Project.findById(projectId); // Find the project by ID
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Check if the authenticated user has the 'owner' role for this project
    const userRole = req.user.projectRoles.get(projectId.toString());
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied");
    }

    // Check if the provided role is valid
    if (!['editor', 'member'].includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    // Find if the requester is already a member of the project
    const memberIndex = project.members.findIndex(member => member.userId.toString() === requesterId.toString());

    // Set the requester's role for this project in the user's projectRoles map
    requester.projectRoles.set(project._id.toString(), role);

    // If the requester is already a member, update their role
    // Otherwise, add them as a new member with the specified role
    if (memberIndex !== -1) {
        project.members[memberIndex].role = role;
    } else {
        project.members.push({ userId: requesterId, role });
    }

    await requester.save(); // Save the requester with the updated roles
    await project.save(); // Save the project with the updated members

    // Send a success response with the updated project
    res.status(200).json(new ApiResponse(200, { project }, "User added and updated in project successfully"));
});

// Get a project by its ID
const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Get project ID from request parameters

    const project = await Project.findById(projectId); // Find the project by ID
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Send a success response with the found project
    res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
});

// Update project details
const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Get project ID from request parameters
    const { name, description } = req.body; // Get new project details from request body

    // Check if the authenticated user has the 'owner' role for this project
    const userRole = req.user.projectRoles.get(projectId.toString());
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied");
    }

    const project = await Project.findById(projectId); // Find the project by ID
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Update the project details if provided, otherwise keep the existing details
    project.name = name || project.name;
    project.description = description || project.description;

    await project.save(); // Save the updated project

    // Send a success response with the updated project
    res.status(200).json(new ApiResponse(200, { project }, "Project updated successfully"));
});

// Delete a project
const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params; // Get project ID from request parameters

    // Check if the authenticated user has the 'owner' role for this project
    const userRole = req.user.projectRoles.get(projectId.toString());
    if (userRole !== 'owner') {
        throw new ApiError(403, "Permission Denied");
    }

    const project = await Project.findById(projectId); // Find the project by ID
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    await project.remove(); // Remove the project

    // Send a success response indicating the project has been deleted
    res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// Get all projects with pagination and aggregation
const getAllProjects = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Get page and limit from query parameters, default to 1 and 10

    const projects = await Project.aggregate([
        // Perform a lookup to get member details from the users collection
        {
            $lookup: {
                from: "users", // Collection to join
                localField: "members.userId", // Field from the Project collection
                foreignField: "_id", // Field from the User collection
                as: "memberDetails" // Name of the new array field to add the results
            }
        },
        // Unwind the memberDetails array to de-normalize the data
        {
            $unwind: "$memberDetails"
        },
        // Group the documents back together
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                members: { $push: "$members" },
                memberDetails: { $push: "$memberDetails" }
            }
        },
        // Skip documents to implement pagination
        {
            $skip: (page - 1) * limit
        },
        // Limit the number of documents returned
        {
            $limit: parseInt(limit)
        }
    ]);

    // Get the total number of projects for pagination info
    const totalProjects = await Project.countDocuments();
    const totalPages = Math.ceil(totalProjects / limit);

    // Send a success response with the paginated projects and pagination info
    res.status(200).json(new ApiResponse(200, { projects, page: parseInt(page), totalPages, totalProjects }, "Projects fetched successfully"));
});

export default { createProject, approveUser, getProjectById, updateProject, deleteProject, getAllProjects };

/*
asyncHandler: A utility function to handle asynchronous operations and catch errors. This helps avoid repetitive try-catch blocks in async functions.
req.body: Contains data sent by the client in the request body. For example, in createProject, it contains projectName and projectDescription.
req.params: Contains route parameters. For example, in getProjectById, it contains projectId.
req.query: Contains query parameters. For example, in getAllProjects, it contains page and limit.
req.user: Contains the authenticated user's information, including _id and projectRoles.
$lookup: A MongoDB aggregation stage to perform left outer joins with other collections.
$unwind: A MongoDB aggregation stage to deconstruct an array field from the input documents.
$group: A MongoDB aggregation stage to group input documents by a specified identifier expression.
$skip: A MongoDB aggregation stage to skip a specified number of documents.
$limit: A MongoDB aggregation stage to limit the number of documents returned.
*/