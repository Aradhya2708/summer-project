import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";

// Create project and assign "owner" role:
const createProject = asyncHandler(async (req, res) => {
    // from frontend we get projectName and projectDescription
    const { projectName, projectDescription } = req.body;
    const userid = req.user._id;

    const newProject = await Project.create(
        {
            name: projectName,
            description: projectDescription,
            members:
                [
                    {
                        userId: userid,
                        role: "owner"
                    }
                ]
        }
    );

    req.user.projectRoles.set(newProject._id.toString(), 'owner');
    await req.user.save();

    res.status(201).json({ msg: "Project Created Successfully", project: newProject });
}); // works

// Join project and assign roles
const joinProject = asyncHandler(async (req, res) => {
    // from frontend, we get projectId, and (new) role
    const { projectId, role } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ msg: "Project not found" });
    }

    if (!['owner', 'editor', 'member'].includes(role)) {
        return res.status(404).json({ msg: "Role not found" });
    }

    const memberIndex = project.members.findIndex(member => member.userId.toString() === userId.toString());

    req.user.projectRoles.set(project._id.toString(), role);

    if (memberIndex !== -1) {
        // member already exists: update role
        project.members[memberIndex].role = role;
    } else {
        // Add new member if user is not already a member
        project.members.push({ userId, role });
    }

    await req.user.save();
    await project.save();

    res.status(200).json({ msg: "User added and updated in project successfully", project });
}); // works

// Get project by project ID
const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ msg: "Project not found" });
    }

    res.status(200).json(project);
});

// Update project
const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const userRole = req.user.projectRoles.get(projectId.toString());
    if (userRole !== 'owner') {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ msg: "Project not found" });
    }

    project.name = name || project.name;
    project.description = description || project.description;

    await project.save();

    res.status(200).json({ msg: "Project updated successfully", project });
});

// Delete project
const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const userRole = req.user.projectRoles.get(projectId.toString());
    if (userRole !== 'owner') {
        return res.status(403).json({ msg: "Permission Denied" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ msg: "Project not found" });
    }

    await project.remove();

    res.status(200).json({ msg: "Project deleted successfully" });
});

export default { createProject, joinProject, getProjectById, updateProject, deleteProject };
