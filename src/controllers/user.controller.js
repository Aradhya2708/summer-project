import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

//home logic goes here
const home = asyncHandler(async (req, res) => {
    res
        .status(200)
        .send("Hello from Home Controller")
})

// Register Logic goes here:
// we will send the "body" of the "req" as req.body in postman => body. And send request as "Post"

/* 
User will provide username, email and password
*/
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if the email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ msg: "Email already exists" });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const userCreated = await User.create({
        username,
        email,
        password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign({ id: userCreated._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    // Send the response with the token
    res.status(201).json({ msg: "User Created Successfully", user: userCreated, token });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            id: user._id
        },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn: '1d'
        }
    );

    res.status(200).json({ token, user: user._id });
});


export default { home, registerUser, loginUser }

