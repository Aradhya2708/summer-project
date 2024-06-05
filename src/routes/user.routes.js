import { Router } from "express";
import userControllers from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT token

const router = Router();

// Home route
router.route("/").get(
    asyncHandler(async (req, res) => {
        res.status(200).send("Hello from Home Route");
    })
);

// Register route
router.route("/register")
    .post(userControllers.registerUser)
    .get(
        asyncHandler(async (req, res) => {
            res.status(200).send("Hello from Register Route");
        })
    );

// Login route
router.post('/login', userControllers.loginUser);

// Logout route
router.post('/logout', verifyToken, userControllers.logoutUser);

// Refresh access token route
router.post('/refresh-token', userControllers.refreshAccessToken);

// Change current password route
router.post('/change-password', verifyToken, userControllers.changeCurrentPassword);

// Get current user route
router.get('/me', verifyToken, userControllers.getCurrentUser);

// Update account details route
router.put('/update-account', verifyToken, userControllers.updateAccountDetails);


export default router;
