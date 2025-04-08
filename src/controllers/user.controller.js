import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

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

export {
  registerUser,
}