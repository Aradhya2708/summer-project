import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//imports
//bcrypt, jwt

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


export const User = mongoose.model("User", userSchema)