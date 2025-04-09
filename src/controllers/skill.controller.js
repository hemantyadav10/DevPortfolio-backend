import mongoose, { isValidObjectId } from "mongoose";
import { Skill } from "../models/skill.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addNewSkill = asyncHandler(async (req, res) => {
  const { name, category, proficiencyLevel, yearsExperience, description = '', projectUrl = '' } = req.body;

  const userId = req?.user._id

  if (!name || !category || !proficiencyLevel || !yearsExperience) {
    throw new ApiError(400, "All fields are required");
  }

  const existingSkill = await Skill.findOne({ name, userId });

  if (existingSkill) {
    throw new ApiError(409, "Skill already exists.");
  }

  const skill = await Skill.create({
    name,
    category: category.toLowerCase(),
    proficiencyLevel,
    yearsExperience,
    description,
    projectUrl,
    userId
  })

  return res
    .status(201)
    .json(new ApiResponse(201, skill, "Skill added successfully."))
})

const deleteSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(skillId)) {
    throw new ApiError(400, "Invalid skill ID");
  }

  const skill = await Skill.findOneAndDelete({ _id: skillId, userId });

  if (!skill) {
    throw new ApiError(404, "Skill not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedId: skill._id }, "Skill deleted successfully."));
})

const updateSkill = asyncHandler(async (req, res) => {
  const { skillId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(skillId)) {
    throw new ApiError(400, "Invalid skill ID");
  }

  const allowedFields = [
    "name",
    "category",
    "proficiencyLevel",
    "yearsExperience",
    "description",
    "projectUrl"
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (field in req.body) {
      if ((field === "category") && typeof req.body[field] === "string") {
        updates[field] = req.body[field].toLowerCase();
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updatedSkill = await Skill.findOneAndUpdate(
    { _id: skillId, userId },
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedSkill) {
    throw new ApiError(404, "Skill not found or unauthorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedSkill, "Skill updated successfully."));
})

const getUserSkillsByCategory = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Aggregation pipeline
  const skillsGrouped = await Skill.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId.createFromHexString(userId)
      }
    },
    {
      $lookup: {
        from: "endorsements",
        localField: "_id",
        foreignField: "skillId",
        as: "endorsements",
        pipeline: [
          {
            $project: {
              _id: 1
            }
          },
        ]
      }
    },
    {
      $addFields: {
        totalEndorsements: { $size: "$endorsements" }
      }
    },
    {
      $group: {
        _id: "$category",
        skills: {
          $push: {
            _id: "$_id",
            name: "$name",
            proficiencyLevel: "$proficiencyLevel",
            yearsExperience: "$yearsExperience",
            verified: "$verified",
            totalEndorsements: "$totalEndorsements"
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        skills: 1
      }
    }
  ])


  return res
    .status(200)
    .json(new ApiResponse(200, skillsGrouped, "Skills grouped by category fetched successfully for the user."));
});

const getAllUserSkills = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 2, page = 1 } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const aggregationPipeline = Skill.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId.createFromHexString(userId)
      }
    }
  ]);

  const skills = await Skill.aggregatePaginate(aggregationPipeline, {
    limit: Number(limit) || 10,
    page: Number(page) || 1,
    sort: { createdAt: -1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, skills, "Skills fetched successfully."))
})

export {
  addNewSkill,
  deleteSkill,
  updateSkill,
  getUserSkillsByCategory,
  getAllUserSkills
}