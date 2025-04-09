import { Endorsement } from "../models/endorsement.model.js";
import { Skill } from "../models/skill.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const dashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const [totalSkills, totalEndorsements, verifiedSkills] = await Promise.all([
    Skill.countDocuments({ userId }),
    Endorsement.countDocuments({ endorsedTo: userId }),
    Skill.countDocuments({ userId, verified: true })
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, { totalSkills, totalEndorsements, verifiedSkills }, "Dashboard stats fetched successfully."))
})

export { dashboardStats }