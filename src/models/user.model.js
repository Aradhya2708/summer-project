import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const userSchema = new Schema(
    {
        username:
        {
            type: String,
            unique: true,
            required: true
        },
        email:
        {
            type: String,
            required: true,
            unique: true
        },
        password:
        {
            type: String,
            required: true
        },
        // Map to store project roles
        projectRoles:
        {
            type: Map,
            of:
            {
                type: String,
                enum: ['owner', 'editor', 'member']
            },
            default: {}
        },
        // Assign the role to the project in the user's projectRoles map:
        //user.projectRoles.set(projectId, role);
    },
    {
        timestamps: true
    }
);

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};


export const User = mongoose.model("User", userSchema)