import { Router } from "express"; 
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
userRouter.route("update-account-details").patch(verifyJWT, updateAccountDetails);
userRouter.route("/update-avatar").patch(
    upload.single("avatar"),
    verifyJWT,
    updateUserAvatar
);
userRouter.route("/update-cover-image").patch(
    upload.single("coverImage"),
    verifyJWT,
    updateUserCoverImage);
userRouter.route("/get-user-details").get(verifyJWT, getCurrentUser);
userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/history").get(verifyJWT, getWatchHistory);

export default userRouter