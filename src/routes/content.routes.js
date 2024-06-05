import { Router } from "express";
import contentControllers from "../controllers/content.controller.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Assuming you have an authentication middleware

import versionRouter from "./version.routes.js";

const router = Router({ mergeParams: true });


// Route to get all content for a project
router.route("/").get(verifyToken, asyncHandler(contentControllers.getAllContent));

// Route to create content for a project
router.route("/").post(verifyToken, asyncHandler(contentControllers.createContent));

// Route to get content by ID
router.route("/:contentId").get(verifyToken, asyncHandler(contentControllers.getContentById));

// Route to update content by ID
router.route("/:contentId").put(verifyToken, asyncHandler(contentControllers.updateContent));

// Route to delete content by ID
router.route("/:contentId").delete(verifyToken, asyncHandler(contentControllers.deleteContent));

// mount
router.use("/:contentId/versions", verifyToken, versionRouter)

export default router;
