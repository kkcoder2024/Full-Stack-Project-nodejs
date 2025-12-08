import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiRespnse } from "../utils/ApiRespnse.js";
import jwt from "jsonwebtoken";

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
