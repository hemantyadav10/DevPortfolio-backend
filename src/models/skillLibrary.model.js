import mongoose from "mongoose";

const skillLibrarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: true,
  },
}, { timestamps: true });

export const SkillLibrary = mongoose.model("SkillLibrary", skillLibrarySchema);