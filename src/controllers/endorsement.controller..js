import mongoose, { isValidObjectId } from "mongoose";
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
    await Endorsement.findByIdAndDelete(existing._id);

    // Check if the skill should be marked as verified
    const count = await Endorsement.countDocuments({ skillId });
    const verified = count >= 3;
    
    if (skill.verified !== verified) {
      await Skill.updateOne({ _id: skillId }, { $set: { verified } });
    }

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

    // Check if the skill should be marked as verified
    const count = await Endorsement.countDocuments({ skillId });
    const verified = count >= 3;
    if (skill.verified !== verified) {
      await Skill.updateOne({ _id: skillId }, { $set: { verified } });
    }

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
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, endorsements, "Recent endorsements fetched."));
})

const getSkillEndorsements = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const { page = 1, limit = 5 } = req.query;

  if (!isValidObjectId(skillId)) {
    throw new ApiError(400, "Invalid skill ID");
  }

  const aggregationPipeline = Endorsement.aggregate([
    {
      $match: {
        skillId: mongoose.Types.ObjectId.createFromHexString(skillId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "endorsedBy",
        foreignField: "_id",
        as: "endorsedBy",
        pipeline: [
          {
            $project: {
              name: 1,
              username: 1,
              profilePictureUrl: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        endorsedBy: { $arrayElemAt: ["$endorsedBy", 0] },
        createdAt: 1
      }
    }
  ])

  const endorsements = await Endorsement.aggregatePaginate(aggregationPipeline, {
    limit: Number(limit) || 10,
    page: Number(page) || 1,
    sort: { createdAt: -1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, endorsements, "Endorsements fetched successfully."))

})

export {
  toggleEndorsement,
  getRecentEndoresements,
  getSkillEndorsements
}