import jwt from 'jsonwebtoken';
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1]; // if cookies not sent, see the authorization header

    if (!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded._id).select('-password -refreshToken');
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid token");
    }
};
