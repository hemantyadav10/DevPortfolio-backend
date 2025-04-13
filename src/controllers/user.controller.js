import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import { Endorsement } from '../models/endorsement.model.js';

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
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    return res
      .status(200)
      .clearCookie("accessToken", accessCookieOptions)
      .clearCookie("refreshToken", refreshCookieOptions)
      .json(new ApiResponse(200, {}, "Logged out successfully"))
  }

  await User.findOneAndUpdate(
    { refreshToken: refreshToken },
    { $unset: { refreshToken: 1 } },
    { new: true }
  )

  return res
    .status(200)
    .clearCookie("accessToken", accessCookieOptions)
    .clearCookie("refreshToken", refreshCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"))
})

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token: user not found")
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used")
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user);

  console.log('access token refreshed')

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new ApiResponse(
      200,
      { accessToken },
      "Access token refreshed"
    ))
})
// Get current user
const currentUser = asyncHandler(async (req, res) => {
  return res
    .status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
});

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

});

// Get developer profile info
const getDeveloperProfileInfo = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, user, "User profile fetched successfully."))
});

// Fetch all developers
const fetchAllDevelopers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 3, query, category } = req.query;

  const pipeline = []

  // full text search for name, title or username
  if (query) {
    pipeline.unshift({
      $search: {
        index: "name",
        compound: {
          should: [
            {
              autocomplete: {
                path: "name",
                query: query,
                fuzzy: { maxEdits: 1 }
              }
            },
            {
              autocomplete: {
                path: "title",
                query: query,
                fuzzy: { maxEdits: 1 }
              }
            },
            {
              text: {
                path: "username",
                query: query
              }
            }
          ],
          minimumShouldMatch: 1
        }
      }
    })
  }

  // lookup skills and endorsements, and sort by total endorsements
  pipeline.push({
    $lookup: {
      from: "skills",
      localField: "_id",
      foreignField: "userId",
      as: "skills",
      pipeline: [
        {
          $lookup: {
            from: "endorsements",
            localField: "_id",
            foreignField: "skillId",
            as: "endorsements",
            pipeline: [
              { $project: { _id: 1 } },
            ]
          }
        },
        {
          $addFields: {
            totalEndorsements: { $size: "$endorsements" }
          }
        },
        { $sort: { totalEndorsements: -1 } },
        { $limit: 3 },
        {
          $project: {
            name: 1,
            proficiencyLevel: 1,
            totalEndorsements: 1,
            category: 1
          }
        }
      ]
    }
  },
  );

  // filter by category if provided
  if (category) {
    pipeline.push({
      $match: {
        "skills.category": category
      }
    });
  }

  pipeline.push({
    $lookup: {
      from: "endorsements",
      localField: "_id",
      foreignField: "endorsedTo",
      as: "endorsements",
      pipeline: [{ $project: { _id: 1 } }]
    }
  },
  );

  pipeline.push({
    $addFields: {
      endorsementCount: { $size: "$endorsements" }
    }
  });

  pipeline.push({
    $project: {
      name: 1,
      username: 1,
      title: 1,
      yearsOfExperience: 1,
      profilePictureUrl: 1,
      skills: 1,
      endorsementCount: 1
    }
  });

  const aggregation = User.aggregate(pipeline);

  const [users, totalDevelopers] = await Promise.all([
    User.aggregatePaginate(aggregation, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { endorsementCount: -1 },
    }),
    User.countDocuments() // total developers without filters
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { ...users, totalDevelopers }, "All developers fetched successfully."))
});

const getFeaturedDevelopers = asyncHandler(async (req, res) => {
  const featuredDevs = await User.aggregate([
    // Join skills
    {
      $lookup: {
        from: "endorsements",
        localField: "_id",
        foreignField: "endorsedTo",
        as: "endorsements",
        pipeline: [
          {
            $project: { _id: 1 }
          }
        ]
      }
    },
    {
      $addFields: {
        totalEndorsementCount: { $size: "$endorsements" }
      }
    },
    {
      $lookup: {
        from: "skills",
        localField: "_id",
        foreignField: "userId",
        as: "skills",
        pipeline: [
          {
            $lookup: {
              from: "endorsements",
              localField: "_id",
              foreignField: "skillId",
              as: "endorsements",
              pipeline: [
                { $project: { _id: 1 } },
              ]
            }
          },
          {
            $addFields: {
              totalEndorsements: { $size: "$endorsements" }
            }
          },
          { $sort: { totalEndorsements: -1 } },
          { $limit: 3 },
          {
            $project: {
              name: 1,
              category: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        name: 1,
        username: 1,
        title: 1,
        yearsOfExperience: 1,
        profilePictureUrl: 1,
        totalEndorsementCount: 1,
        skills: 1
      }
    },
    { $sort: { totalEndorsementCount: -1 } },
    { $limit: 3 }

  ]);

  res.status(200).json(new ApiResponse(200, featuredDevs, "Top featured developers."));
});


export {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  currentUser,
  updateUserProfile,
  getDeveloperProfileInfo,
  fetchAllDevelopers,
  getFeaturedDevelopers
}