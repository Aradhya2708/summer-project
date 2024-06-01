import { Router } from 'express';
import projectControllers from '../controllers/project.controller.js';
import auth from '../middlewares/auth.js';

//route import:
import contentRouter from "./content.routes.js"


const router = Router();

// Route to create a project (protected route)
router.route('/create').post(auth, projectControllers.createProject);

// Route to join a project (protected route)
router.route('/join').post(auth, projectControllers.joinProject);

// Get project by project ID (protected route)
router.route('/:projectId').get(auth, projectControllers.getProjectById);

// Update a project (protected route)
router.route('/:projectId').put(auth, projectControllers.updateProject);

// Delete a project (protected route)
router.route('/:projectId').delete(auth, projectControllers.deleteProject);

// Mount content routes
router.use("/:projectId/content", auth, contentRouter)

export default router;
