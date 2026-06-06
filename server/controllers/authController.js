import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logAction } from "../utils/logService.js";

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "JWT secret is not configured");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (
    ![name, email, password].every(
      (field) => typeof field === "string" && field.trim(),
    )
  ) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const createdUser = sanitizeUser(user);

  return res.status(201).json(
    new ApiResponse(201, "User registered successfully", {
      user: createdUser,
    }),
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    ![email, password].every(
      (field) => typeof field === "string" && field.trim(),
    )
  ) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);
  const loggedInUser = sanitizeUser(user);

  // Log login activity (non-blocking)
  logAction(user._id, "LOGIN").catch(() => {});

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      token,
      user: loggedInUser,
    }),
  );
});

const getProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Profile fetched successfully", {
      user: sanitizeUser(req.user),
    }),
  );
});

export { registerUser, loginUser, getProfile };
