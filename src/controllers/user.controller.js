import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

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

export {
  registerUser,
  login, 
}