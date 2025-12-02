import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiRespnse } from "../utils/ApiRespnse.js";
// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
// const registerUser = asyncHandler(async (req, res) => {
//   const { fullname, username, email, password } = req.body;
//   if (
//     [fullname, username, email, password].some(
//       (item) => !item || item.trim() === ""
//     )
//   ) {
//     throw new ApiErrorHandle(400, "All fields are required");
//   }

//   const existedUser = User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiErrorHandle(400, "User already existed");
//   }

//   const avatarLocalPath = req.files?.avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage[0]?.path;
//   if (!avatarLocalPath) {
//     throw new ApiErrorHandle(400, "Avatar file is required.");
//   }

//   const avatar = await uploadOnCloudinary(avatarLocalPath);
//   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//   if (!avatar) {
//     throw new ApiErrorHandle(400, "Avatar file is required.");
//   }

//   const userInput = await User.create({
//     fullname,
//     username,
//     email,
//     password,
//     coverImage: coverImage?.url || "",
//     avatar: avatar.url,
//   });

//   const createdUser = await User.findById(userInput._id).select(
//     "-password -refreshToken" // ei duto field select habe na, age - sign die start kora hoeche
//   );
//   if (!createdUser) {
//     throw new ApiErrorHandle(500, "User Upload Failed!");
//   }

//   return res
//     .status(201)
//     .json(new ApiRespnse(200, createdUser, "User Register Successfully."));
// });

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, fullname, password } = req.body;
  // validation - not empty
  if (
    [username, email, fullname, password].some((item) => item.trim() === "")
  ) {
    throw new ApiErrorHandle(400, "All fields are required");
  }
  // check if user already exists: username, email
  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existUser) {
    throw new ApiErrorHandle(400, "User already exist");
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.avatar[0].path;
  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar file is required!");
  }
  // upload them to cloudinary, avatar
  const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath);
  const coverImageClodinary = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatarCloudinary) {
    throw new ApiErrorHandle(400, "Avatar file is required!");
  }
  // create user object - create entry in db
  const userInput = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatarCloudinary.url,
    coverImage: coverImageClodinary?.url,
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(userInput._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiErrorHandle(400, "User Registration Failed!");
  }

  res
    .status(201)
    .json(new ApiRespnse(200, createdUser, "User Register Successfully."));
});

export { registerUser };
