import { Router } from "express"; 
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount : 1,
        }
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

userRouter.route("/update-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("update-account-details").post(verifyJWT, updateAccountDetails);
userRouter.route("/update-avatar").post(
    upload.fields([{name: "avatar", maxCount:1}]),
    verifyJWT,
    updateUserAvatar
);
userRouter.route("/update-cover-image").post(
    upload.fields([{name: "coverImage", maxCount : 1}]),
    verifyJWT,
    updateUserCoverImage);
userRouter.route("/get-user-details").post(verifyJWT, getCurrentUser);
export default userRouter