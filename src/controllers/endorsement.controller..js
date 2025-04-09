import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Endorsement } from "../models/endorsement.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Skill } from "../models/skill.model.js";
import { ApiError } from "../utils/apiError.js";

const toggleEndorsement = asyncHandler(async (req, res) => {
  const { skillId, endorsedTo } = req.body;
  const endorsedBy = req.user._id;

  // Validate ObjectIds
  if (!isValidObjectId(skillId)) {
    throw new ApiError(400, "Invalid skill ID");
  }

  if (!isValidObjectId(endorsedTo)) {
    throw new ApiError(400, "Invalid endorsed user ID");
  }

  // Check if the user is trying to endorse themselves
  if (endorsedBy.toString() === endorsedTo.toString()) {
    throw new ApiError(400, "You cannot endorse your own skill.");
  }

  // Check if the skill exists
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new ApiError(404, "Skill not found");
  }

  // Check if endorsement already exists
  const existing = await Endorsement.findOne({ skillId, endorsedBy, endorsedTo });

  if (existing) {
    // Remove endorsement
    await existing.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, { removed: true, id: existing._id }, "Endorsement removed."));
  } else {
    // Add new endorsement
    const newEndorsement = await Endorsement.create({
      skillId,
      endorsedBy,
      endorsedTo,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newEndorsement, "Endorsement added."));
  }
});

const getRecentEndoresements = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 3 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (limit <= 0) {
    throw new ApiError(400, "Limit must be a positive number.");
  }

  const endorsements = await Endorsement.find({ endorsedTo: userId })
    .populate("skillId", "name category")
    .populate("endorsedBy", "name username profilePictureUrl")
    .populate("endorsedTo", "name username profilePictureUrl")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, endorsements, "Recent endorsements fetched."));
})

export {
  toggleEndorsement,
  getRecentEndoresements
}