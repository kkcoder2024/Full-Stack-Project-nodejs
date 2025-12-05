import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // write _ in place of unusable parameter
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiErrorHandle(401, "Unauthorized user");
    }
    const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userData = await User.findById(decodedUser._id).select(
      "-password -refreshToken"
    );
    if (!userData) {
      throw new ApiErrorHandle(401, "Invalid access token");
    }

    // req.(user) = user; this name will be anything in the ()
    req.user = userData;
    next();
  } catch (error) {
    throw new ApiErrorHandle(401, error?.message || "Invalid access token");
  }
});
