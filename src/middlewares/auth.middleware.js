import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

// Middleware to authenticate user via JWT; throws error if invalid or missing.
const verifyJwt = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1]

  if (!token) throw new ApiError(401, "Unauthorized request");

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token", error);
  }

  const { _id } = decodedToken;
  const user = await User.findById(_id).select("-password -refreshToken");

  if (!user) throw new ApiError(401, "Unauthorized request");

  req.user = user;
  next();
});

/// Middleware to optionally authenticate user via JWT; continues if invalid or missing.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    console.log("No token provided. Continuing without authentication.");
    return next();
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    console.log("Invalid token:", error.message);
    return next();
  }

  const { _id } = decodedToken;
  const user = await User.findById(_id).select("-password -refreshToken");

  if (!user) {
    console.log("Token is valid but user not found.");
    return next();
  }

  req.user = user;
  next();
});

export { verifyJwt, optionalAuth }