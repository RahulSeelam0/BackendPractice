import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            throw new ApiError(401, "Unauthorized request");
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Make sure JWT_SECRET is set
        req.user = decoded;
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
        if(!user){
            
            throw new ApiError(401, "Invalid or expired Access Token");
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
   
})