import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendLoginAlertEmail, sendWelcomeEmail } from "../emails/emailHandlers.js";

import dotenv from "dotenv";
dotenv.config();

export const signup = async (req, res)=>{
    try {
        const {name, username, email, password} = req.body;
    if(!name || !username || !email || !password){
        return res.status(400).json({success: false, message: "All fields are required"})
    }

    const existingEmail = await User.findOne({email})
    if(existingEmail){
        return res.status(400).json({success:false, message:"Email already exists"});
    }

    const existingUsername = await User.findOne({username})
    if(existingUsername){
        return res.status(400).json({success:false, message:"Username already exists"});
    }

    if(password.length < 6){
        return res.status(400).json({success:false, message:"Password should be at least 6 characters long"});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user  = new User({
        name,
        username,
        email,
        password: hashedPassword
    });
    await user.save();

    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn:"3d"});
    res.cookie("jwt-linkedin", token, {
        httpOnly:true,  // prevent XSS attack
        sameSite:"strict", // prevent CSRF attacks,
        maxAge:3*24*60*60*1000,
        secure:process.env.NODE_ENV === "production" // prevents man-in-the-middle attacks
    })

    res.status(201).json({success:true, message:"User created successfully"});
    //TODO send welcome email

    const profileUrl = process.env.CLIENT_URL + "/profile/" + user.username;

    try {
        await sendWelcomeEmail(user.email, user.name, profileUrl);
        
    } catch (emailError) {
        console.log("Error in sending email", emailError.message);
        
    }
        
    } catch (error) {
        console.log("Error in signup" ,error.message);
        res.status(500).json({success:false, message:"Something went wrong"})
     
    }
}
export const login = async(req, res)=>{

    try {
        const {username, password} = req.body;

        if(!username || !password){
            return res.status(400).json({success:false, message:"All fields are required"});
        }

        const user = await User.findOne({username});
        if(!user){
            return res.status(400).json({success:false, message:"User does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({success:false, message:"Invalid credentials"});
        }

        const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET, {expiresIn:"3d"});
        await res.cookie("jwt-linkedin", token, {
            httpOnly:true,  // prevent XSS attack
            sameSite:"strict", // prevent CSRF attacks,
            maxAge:3*24*60*60*1000,
            secure:process.env.NODE_ENV === "production" // prevents man-in-the-middle attacks
        })

        res.status(200).json({success:true, message:"User logged in successfully"});

        if (process.env.SEND_LOGIN_EMAIL === "true") {
            try {
                await sendLoginAlertEmail(user.email, user.name);
            } catch (emailError) {
                console.log("Error in sending login email", emailError.message);
            }
        }
        
    } catch (error) {
        console.log("Error in login" ,error.message);
        res.status(500).json({success:false, message:"Something went wrong"})
        
    }

}
export const logout = (req, res)=>{
    res.clearCookie("jwt-linkedin");
    res.status(200).json({success:true, message:"User logged out successfully"});
}



export const getCurrentUser = async(req, res)=>{
    try {
        res.json(req.user);
    } catch (error) {
        console.error("Error in getting current user", error.message);
        res.status(500).json({success:false, message:"Internal Server Error"});
    }
}