import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from '../models/user.model.js';
import { ApiResponse } from "../utils/apiResponse.js";
import { Skill } from "../models/skill.model.js";
import { Endorsement } from "../models/endorsement.model.js";


const getPlatformStats = asyncHandler(async (_req, res) => {
  const [totalDevelopers, verifiedSkills, totalEndorsements] = await Promise.all([
    User.countDocuments(),
    Skill.countDocuments({ verified: true }),
    Endorsement.countDocuments()
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, { totalDevelopers, verifiedSkills, totalEndorsements }, "Platform stats fetched successfully."));
});

export { getPlatformStats }