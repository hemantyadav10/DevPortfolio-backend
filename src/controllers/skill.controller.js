import { isValidObjectId } from "mongoose";
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
      if ((field === "category" || field === 'name') && typeof req.body[field] === "string") {
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

export {
  addNewSkill,
  deleteSkill,
  updateSkill
}