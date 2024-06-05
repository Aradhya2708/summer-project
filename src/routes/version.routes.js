import { Router } from "express";
import versionControllers from "../controllers/version.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT token
import { upload } from "../middlewares/multer.middleware.js";

const router = Router({ mergeParams: true });

// Middleware to authenticate requests
router.use(verifyToken);

// Get all versions
router.get("/", versionControllers.getAllVersions)

// Create new version
router.post("/",
    upload.fields([
        {
            name: "file",
            maxCount: 1
        }
    ]), versionControllers.createVersion);

// Get version by ID
router.get("/:versionId", versionControllers.getVersionById);

// Update version
router.put("/:versionId", versionControllers.updateVersion);

// Delete version
router.delete("/:versionId", versionControllers.deleteVersion);

// Approve version
router.post("/:versionId", versionControllers.approveVersion)

export default router;
