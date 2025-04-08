import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    trim: true,
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
  },
  bio: {
    type: String,
    trim: true,
  },
  profilePictureUrl: {
    type: String,
    trim: true,
  },
  socialLinks: {
    github: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
  },
  refreshToken: String,
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
})

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}

// Generate access token
userSchema.methods.generateAccessToken = function () {

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      name: this.name
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
}

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
}

userSchema.plugin(mongooseAggregatePaginate);

export const User = mongoose.model("User", userSchema);