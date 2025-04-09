import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY),
  sameSite: 'None',
};

const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY),
  sameSite: 'None',
};

// Generate and store access and refresh tokens for the user
const generateAccessAndRefreshTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, 'something went wrong while generating refresh/access token:', error)
  }
}

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, name, password } = req.body;

  if ([username, email, name, password].some((field) => !field || field.trim() === '')) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) throw new ApiError(409, "User already exists");

  const user = await User.create({
    name,
    email,
    username,
    password,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { userId: user._id }, "Registration successful."));
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Either username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });


  if (!user) {
    throw new ApiError(404, "Invalid credentials")
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new ApiResponse(
      200,
      {
        user: userResponse,
        accessToken,
      },
      "User logged in successfully"
    ))
})

// Logout user
const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } }
  );

  return res
    .status(200)
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token: user not found")
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token: token mismatch")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new ApiResponse(200, accessToken, "Access token refreshed successfully"))
});

// Get current user
const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allowedFields = [
    "name",
    "title",
    "yearsOfExperience",
    "bio",
    "profilePictureUrl",
    "github",
    "linkedin",
    "twitter",
    "website"
  ];

  const updates = {};
  const socialLinks = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (["github", "linkedin", "twitter", "website"].includes(field)) {
        socialLinks[field] = req.body[field];
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  if (Object.keys(socialLinks).length > 0) {
    updates.socialLinks = socialLinks;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update.");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User profile updated successfully."))

})

export {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  currentUser, 
  updateUserProfile
}