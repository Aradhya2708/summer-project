import { Router } from "express";
import userControllers from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asynchandler.js";

const router = Router()

// Home route
router.route("/").get(userControllers.home)

// Register route //post is to insert, get is to read data only
// each route can have different controllers for different types of requests
router.route("/register")
.post(userControllers.registerUser)
.get(
    asyncHandler(async (req, res)=>{
        res
            .status(200)
            .send("Hello from Register Route")
    })
)

router.post('/login', userControllers.loginUser);

export default router