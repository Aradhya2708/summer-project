import { asyncHandler } from "../utils/asynchandler.js"; // Utility function to handle async errors
import { ApiError } from "../utils/ApiError.js"; // Custom error class for API errors
import { User } from "../models/user.model.js"; // User model
import jwt from 'jsonwebtoken'; // JSON Web Token library for token generation and verification
import bcrypt from 'bcryptjs'; // Library for hashing passwords
import { ApiResponse } from "../utils/ApiResponse.js"; // Custom response class for API responses

/**
 * Helper function to generate access and refresh tokens for a user
 * @param {String} userId - The ID of the user
 * @returns {Object} - An object containing accessToken and refreshToken
 */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId); // Fetch the user from the database
        const accessToken = user.generateAccessToken(); // Generate an access token for the user
        const refreshToken = user.generateRefreshToken(); // Generate a refresh token for the user

        user.refreshToken = refreshToken; // Save the refresh token in the user's document
        await user.save({ validateBeforeSave: false }); // Save the user without running validation

        return { accessToken, refreshToken }; // Return the generated tokens
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

/**
 * Controller for user registration
 */
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body; // Get registration details from request body

    if (!username || !email || !password) {
        throw new ApiError(400, "All Fields are Required"); // Throw an error if any field is missing
    }

    // Check if a user with the same username or email already exists
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (userExists) {
        throw new ApiError(409, "User with email or username already exists"); // Throw an error if user exists
    }

    // Create a new user with the provided details
    const userCreated = await User.create({
        username,
        email,
        password
    });

    // Fetch the created user without the password and refreshToken fields
    const createdUser = await User.findById(userCreated._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user"); // Throw an error if user creation failed
    }

    // Generate access and refresh tokens for the newly created user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);

    // Set options for the cookies
    const options = {
        httpOnly: true, // Make cookies accessible only by the web server
        secure: true // Send cookies only over HTTPS
    };

    // Send the response with the created user and set cookies
    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/**
 * Controller for user login
 */
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body; // Get login details from request body

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required"); // Throw an error if both fields are missing
    }

    // Find the user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // Check if user exists and the password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, "Invalid Credentials"); // Throw an error if credentials are invalid
    }

    // Generate access and refresh tokens for the user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Fetch the logged-in user without the password and refreshToken fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set options for the cookies
    const options = {
        httpOnly: true, // Make cookies accessible only by the web server
        secure: true // Send cookies only over HTTPS
    };

    // Send the response with the logged-in user and set cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

/**
 * Controller for user logout
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Remove the refresh token from the user's document
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    // Set options for the cookies
    const options = {
        httpOnly: true, // Make cookies accessible only by the web server
        secure: true // Send cookies only over HTTPS
    };

    // Clear the accessToken and refreshToken cookies and send the response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});

/**
 * Controller to refresh the access token using the refresh token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get the refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request"); // Throw an error if no refresh token is provided
    }

    try {
        // Verify the incoming refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id); // Find the user by ID from the decoded token

        if (!user) {
            throw new ApiError(401, "Invalid refresh token"); // Throw an error if user is not found
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used"); // Throw an error if refresh token is invalid
        }

        // Set options for the cookies
        const options = {
            httpOnly: true, // Make cookies accessible only by the web server
            secure: true // Send cookies only over HTTPS
        };

        // Generate new access and refresh tokens for the user
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Send the response with the new tokens and set cookies
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token"); // Throw an error if token verification fails
    }
});

/**
 * Controller to change the current user's password
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body; // Get old and new passwords from request body

    const user = await User.findById(req.user?._id); // Find the authenticated user by ID
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); // Check if the old password is correct

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password"); // Throw an error if old password is incorrect
    }

    user.password = newPassword; // Set the new password for the user
    await user.save({ validateBeforeSave: false }); // Save the user without running validation

    // Send a success response indicating the password change
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Controller to get the current logged-in user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(404, "User not found"); // Throw an error if no user is found in the request
    }
    // Send a success response with the authenticated user
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

/**
 * Controller to update the account details of the current user
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email } = req.body; // Get new email from request body

    if (!email) {
        throw new ApiError(400, "Email is required"); // Throw an error if email is missing
    }

    // Update the user's email and return the updated user without the password field
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email
            }
        },
        { new: true }
    ).select("-password");

    // Send a success response with the updated user
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

export default {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
};

/*
AsyncHandler: A utility function to handle asynchronous operations and catch errors. This helps avoid repetitive try-catch blocks in async functions.
req.body: Contains data sent by the client in the request body. For example, in registerUser, it contains username, email, and password.
req.params: Contains route parameters, used in routes where dynamic segments are present.
req.query: Contains query parameters, typically used for pagination or filtering.
req.user: Contains the authenticated user's information, including _id and other user-specific details.
jwt.verify: Verifies the provided JSON Web Token to ensure it's valid and not expired.
bcrypt.compare: Compares the provided password with the hashed password stored in the database.
generateAccessAndRefreshTokens: A helper function to generate and return access and refresh tokens for the user.
User.findByIdAndUpdate: A Mongoose method to find a user by ID and update their details.
*/
