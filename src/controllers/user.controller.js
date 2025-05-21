import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
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
    const {fullName, email, username, password} = req.body;
    console.log(fullName, username);

    if(
        [fullName, email, username, password].some((field)=>
        field?.trim() === ""
        )
    ){
        throw new ApiError(400, "All field are required");
    }
    const existedUser = User.findOne({
        $or : [{username},{email}]
    });
    if(existedUser){
        throw new ApiError(409, "User already exist");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(coverImageLocalPath);
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }
    const userEntry = await User.create({
        fullName, avatar : avatar.url, email, coverImage : coverImage?.url || "",username : username.toLowerCase(), password 
    });
    const createdUser = await User.findById(userEntry._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Error registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})



export { registerUser }