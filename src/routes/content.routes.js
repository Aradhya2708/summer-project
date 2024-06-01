import { Router } from "express";
import contentControllers from "../controllers/content.controller.js";
import versionRouter from "./version.routes.js";
import auth from "../middlewares/auth.js";

const router = Router({ mergeParams: true });

router.use(auth); // Apply authentication middleware for all content routes

router.get("/", contentControllers.getAllContent);
router.post("/", contentControllers.createContent);
router.get("/:contentId", contentControllers.getContentById);
router.put("/:contentId", contentControllers.updateContent);
router.delete("/:contentId", contentControllers.deleteContent);

router.use("/:contentId/versions", versionRouter);

export default router;
