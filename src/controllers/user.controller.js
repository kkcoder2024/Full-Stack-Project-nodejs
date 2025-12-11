import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import {
  updateImageOnCloudinary,
  uploadOnCloudinary,
} from "../utils/fileUpload.js";
import { ApiRespnse } from "../utils/ApiRespnse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const userdata = await User.findById(userId);
    const genAccessToken = userdata.generateAccessToken();
    const genRefreshToken = userdata.generateRefreshToken();
    userdata.refreshToken = genRefreshToken;
    await userdata.save({ validateBeforeSave: false });
    // return the value of access and refresh so that i can get that data using this function
    return { genAccessToken, genRefreshToken };
  } catch (error) {
    throw new ApiErrorHandle(500, "Somnething went wrong");
  }
};

// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (
    [fullname, username, email, password].some(
      (item) => !item || item.trim() === ""
    )
  ) {
    throw new ApiErrorHandle(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiErrorHandle(400, "User already existed");
  }
  console.table(req.body);
  console.log(JSON.stringify(req.files.avatar[0]));

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar file is required.");
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatarUpload) {
    throw new ApiErrorHandle(500, "Avatar file fail to upload.");
  }

  const userInput = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
  });

  const createdUser = await User.findById(userInput._id).select(
    "-password -refreshToken" // ei duto field select habe na, age - sign die start kora hoeche
  );
  if (!createdUser) {
    throw new ApiErrorHandle(500, "User Upload Failed!");
  }

  return res
    .status(201)
    .json(new ApiRespnse(200, createdUser, "User Register Successfully."));
});

// first check the input
//then fetch the user if present
//then generate access and refresh token
//sent the accesstoekn to cookies
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const userEmail = email?.trim().toLowerCase();
  const userUsername = username?.trim();
  const userPassword = password?.trim();

  if (!userEmail && !userUsername) {
    throw new ApiErrorHandle(400, "Email or Username is required.");
  }
  const userDataFromDatabase = await User.findOne({
    $or: [{ email: userEmail }, { username: userUsername }],
  });
  if (!userDataFromDatabase) {
    throw new ApiErrorHandle(404, "User not found!");
  }
  console.log(userDataFromDatabase); //this provide the object
  const isPasswordMatched = await userDataFromDatabase.isPasswordCorrect(
    userPassword //isPasswordCorrect() from user.models.js
  );
  if (!isPasswordMatched) {
    throw new ApiErrorHandle(400, "Password not matched!");
  }
  // generate access token and refresh token and get the token for further use
  const { genAccessToken, genRefreshToken } =
    await generateAccessAndRefreshToken(userDataFromDatabase._id);

  // fetch logged in user again without password
  const loggedInUser = await User.findById(userDataFromDatabase._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", genAccessToken, options)
    .cookie("refreshToken", genRefreshToken, options)
    .json(
      new ApiRespnse(
        200,
        {
          userDataFromDatabase: loggedInUser,
          genAccessToken,
          genRefreshToken,
        },
        "User loggedin Successfully"
      )
    );
});

// logout suer
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespnse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrorHandle(401, "Refresh Token not found");
  }
  try {
    const decodedToekn = jwt.verify(
      //{decodedToekn} store a object that help in authentication
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userData = await User.findById(decodedToekn?._id).select("-password");
    if (!userData) {
      throw new ApiErrorHandle(400, "Refresh Token not found");
    }

    if (incomingRefreshToken !== userData?.refreshToken) {
      throw new ApiErrorHandle(400, "Invalid Refresh Token");
    }

    const { genAccessToken, newgenRefreshToken } =
      await generateAccessAndRefreshToken(userData._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("refreshToken", newgenRefreshToken, options)
      .cookie("accessToken", genAccessToken, options)
      .json(
        new ApiRespnse(
          200,
          {
            genAccessToken,
            genRefreshToken: newgenRefreshToken,
          },
          "Access Token refreshed."
        )
      );
  } catch (error) {
    throw new ApiErrorHandle(500, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiErrorHandle(
      400,
      "Please match password with confirm password."
    );
  }
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiErrorHandle(400, "Invalid Password!");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRespnse(200, {}, "Password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiRespnse(200, req.user, "Current User Fetched successfully.")); //req.user this comes from middelware
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname, // if both name same then write just email
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiRespnse(200, user, "User details updated successfully."));
});

const updateAvater = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar file not uploaded!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiErrorHandle(400, "Avatar file fail to upload on server!");
  }
  const oldImage = await User.findById(req.user._id);
  const updatedCloudinaryImage = await updateImageOnCloudinary(
    oldImage.avatar,
    avatarLocalPath
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: updatedCloudinaryImage,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespnse(200, user, "User avatar update successfully."));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocal = req.file?.path;
  if (!coverImageLocal) {
    throw new ApiErrorHandle(400, "Cover Image not upladed!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocal);
  if (!coverImage.url) {
    throw new ApiErrorHandle(400, "Cover Image not upladed!");
  }
  const oldCoverImage = await User.findById(req.user._id);
  const updateCoverImgOnCloudinary = await updateImageOnCloudinary(
    oldCoverImage.coverImage,
    coverImageLocal
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: updateCoverImgOnCloudinary,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespnse(200, user, "Cover Image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiErrorHandle(400, "User name not found!");
  }

  const getChannel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        foreignField: "subscriber",
        localField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubcribedToCount: {
          $size: "$subscribedTo",
        },
        isCubcribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubcribedToCount: 1,
        isCubcribed: 1,
      },
    },
  ]); //aggregate pipeline retuen arrays in result

  if (!getChannel?.length) {
    throw new ApiErrorHandle(404, "Channel does not exist.");
  }

  return res
    .status(200)
    .json(new ApiRespnse(200, "Channels fetched successfully."));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id: req.user._id, //when $match work for collect data through _id, in aggregate method, mongoose not work,
        // so we directly not send the id in string, we modify string into objectID
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "watchHistory",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localStorage: "owner",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "owner",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!user) {
    throw new ApiErrorHandle(400, "User not found!");
  }
  return res
    .status(200)
    .json(
      new ApiRespnse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    ); // user return an array
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateAvater,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
};
