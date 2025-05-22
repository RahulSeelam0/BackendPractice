import fs from 'fs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { deleteOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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


export { registerUser }