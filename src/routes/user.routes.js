import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getCurrentUser,
} from "../controllers/user.controller.js";
const router = Router();
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { updateImageOnCloudinary } from "../utils/fileUpload.js";

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//for register
// router.route("/login").post(loginUser); //for login

// for logout user
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user/details").patch(verifyJWT, updateUserDetails);
router
  .route("/update-user/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvater);
router
  .route("/update-user/cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getUserWatchHistory);
export { router };
