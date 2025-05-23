import fs from 'fs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, replaceOnCloudinary , deleteOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import path from 'path';

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessTokens();
        const refreshToken = user.generateRefreshTokens();

        user.refreshToken = refreshToken;
        user.accessToken = accessToken;
        await user.save({ validateBeforeSave : false});

        return { accessToken, refreshToken };
    } catch (error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) =>{
    //get user details from frontend
    //validation - not empty
    //check if user already exist
    //check for images, check for avatar
    //if all good then upload them to cloudinary, avatar
    //create user object  - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res 
    const {fullname, email, username, password} = req.body;

    //const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (
        [fullname, email, username, password].some(field => !field || field?.trim() === "")
    ) {
        // if (avatarLocalPath)  fs.unlinkSync(avatarLocalPath);
        // if (coverImageLocalPath)  fs.unlinkSync(coverImageLocalPath);
        deleteLocalFiles(avatarLocalPath, coverImageLocalPath);
        throw new ApiError(400, "All fields are required");
    }    
    const existedUser = await User.findOne({
        $or : [{username},{email}]
    });
    if(existedUser){
        deleteLocalFiles(avatarLocalPath, coverImageLocalPath);
        throw new ApiError(409, "User already exist");
    }

    if(!avatarLocalPath){
        deleteLocalFiles(avatarLocalPath, coverImageLocalPath);
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        deleteLocalFiles(avatarLocalPath, coverImageLocalPath);
        throw new ApiError(400, "Avatar file is required");
    }
    const userEntry = await User.create({
        fullname, avatar : avatar.url, email, coverImage : coverImage?.url || "",username : username.toLowerCase(), password 
    });
    const createdUser = await User.findById(userEntry._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        await deleteOnCloudinary([avatar.public_id, coverImage.public_id]);
        throw new ApiError(500, "Error registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})
function deleteLocalFiles(avatarLocalPath, coverImageLocalPath){
    if (avatarLocalPath)  fs.unlinkSync(avatarLocalPath);
    if (coverImageLocalPath)  fs.unlinkSync(coverImageLocalPath);
}

const loginUser = asyncHandler(async (req, res)=>{
    //get details of email id/user name and password from the user
    //username/email exist or not
    //find user
    //check the passowrd
    //access and refresh token 
    //send cookie

    const {email, username, password} = req.body
    if(!username && !email){
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or : [{username},{email}]
    });
    if(!user){
        throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Password Incorrect");
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly : true,
        secure : true,
    }
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200,{
            user : loggedInUser, accessToken, refreshToken,
        }, "User logged In Succesfully")
    );
})

const logoutUser = asyncHandler(async(req, res) => {
    
    await User.findByIdAndUpdate(req.user._id,{
        $set : {
            refreshToken : undefined,
            }
        },
        {
            new : true
        }
    ) 
    const options = {
        httpOnly : true,
        secure : true,
        sameSite : 'None',
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200, {},"User logged Out"));
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token");
        } 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token expired or used");
        }
        const options = {
            httpOnly : true,
            secure : true,
        }
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200).cookie("accessToken", newAccessToken, options).cookie("refreshToken", newRefreshToken, options).json(
            new ApiResponse(200,{
                user : user, newAccessToken, newRefreshToken,
            }, "User logged In Succesfully")
        );
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token");
    }

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword, confirmNewPassword} = req.body;

    if(newPassword !== confirmNewPassword){
        throw new ApiError(400, "Confrim password should be same as new password");
    }
    const user = await User.findById(req.user?._id);
    
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isOldPasswordCorrect){
        throw new ApiError(400, "Old password incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, {}, "Password changed succesfully"));
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200).json(200, req.user, "Current user fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body;
    if(!fullname || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
    {
        $set : {
            fullname : fullname,
            email : email,
        }
    },
    {new: true}).select("-password");
    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.files?.avatar[0].path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }
    console.log(req.user?._id);
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Extract public_id from Cloudinary URL
    const oldAvatarUrl = user.avatar;

    const publicId = oldAvatarUrl.split("/").pop().split(".")[0];

    const newAvatar = await replaceOnCloudinary(publicId, avatarLocalPath);
    if (!newAvatar?.secure_url) {
        throw new ApiError(500, "Failed to replace avatar");
    }

    // Update user's avatar in DB
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: newAvatar.secure_url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.files?.coverImage[0].path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image  file is missing");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Extract public_id from Cloudinary URL
    const oldCoverImageUrl = user.coverImage;
    const publicId = oldCoverImageUrl.split("/").pop().split(".")[0];

    // Replace on Cloudinary
    const newCoverImage = await replaceOnCloudinary(publicId, coverImageLocalPath);
    if (!newCoverImage?.secure_url) {
        throw new ApiError(500, "Failed to replace avatar");
    }

    // Update user's avatar in DB
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: newCoverImage.secure_url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Cover Image updated successfully"));
});
export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage}