import { Router } from "express";
import projectControllers from "../controllers/project.controller.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Assuming you have an authentication middleware

const router = Router();

// Route to create a project
router.route("/create").post(verifyToken, asyncHandler(projectControllers.createProject));

// Route to join a project
router.route("/join").post(verifyToken, asyncHandler(projectControllers.joinProject));

// Route to get a project by ID
router.route("/:projectId").get(verifyToken, asyncHandler(projectControllers.getProjectById));

// Route to update a project
router.route("/:projectId").put(verifyToken, asyncHandler(projectControllers.updateProject));

// Route to delete a project
router.route("/:projectId").delete(verifyToken, asyncHandler(projectControllers.deleteProject));

// Route to get all projects with pagination
router.route("/").get(verifyToken, asyncHandler(projectControllers.getAllProjects));

export default router;
