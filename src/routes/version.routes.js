import { Router } from "express";
import versionControllers from "../controllers/version.controller.js";
import auth from "../middlewares/auth.js";

const router = Router({ mergeParams: true });

router.use(auth); // Apply authentication middleware for all version routes

router.post("/", versionControllers.createVersion);
router.get("/:versionId", versionControllers.getVersionById);
router.put("/:versionId", versionControllers.updateVersion);
router.delete("/:versionId", versionControllers.deleteVersion);

export default router;
