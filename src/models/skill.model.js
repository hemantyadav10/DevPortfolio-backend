import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { validCategories } from '../constants.js';

const skillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: validCategories,
    required: true,
    index: true,
  },
  proficiencyLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  yearsExperience: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  projectUrl: {
    type: String,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

skillSchema.plugin(mongooseAggregatePaginate);

export const Skill = mongoose.model("Skill", skillSchema);