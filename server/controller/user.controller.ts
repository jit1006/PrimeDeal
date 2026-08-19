import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary";
import { generateToken } from "../utils/generatToken";
import { prisma } from "../db/db";
import { AppError, asyncHandler } from "../utils/asyncHandler";

/* ---------------------- SIGN UP ---------------------- */
export const signUp = asyncHandler(async (req, res) => {
  let { fullname, email, password, contact, phoneNumber, admin } = req.body;

  // check if user exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) throw new AppError("User already exists", 400);

  fullname = fullname.trim();
  const phone = (contact || phoneNumber || "").trim();
  password = await bcrypt.hash(password, 10);

  // create user
  user = await prisma.user.create({
    data: {
      fullname,
      email,
      passwordHash: password,
      phoneNumber: phone,
      admin,
    },
  });

  generateToken(res, user);
  //@ts-ignore
  delete user.passwordHash;

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    user,
  });
});

/* ---------------------- LOGIN ---------------------- */
export const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("No user found with this email", 400);

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) throw new AppError("Incorrect Password", 400);

  generateToken(res, user);

  // Update last login
  const createdUser = await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
    select: {
      id: true,
      fullname: true,
      email: true,
      phoneNumber: true,
      profilePicture: true,
      admin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    success: true,
    message: `Welcome back ${user.fullname}`,
    user: createdUser,
  });
});

/* ---------------------- LOGOUT ---------------------- */
export const logout = asyncHandler(async (req, res) => {
  res
    .clearCookie("token")
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
});

/* ---------------------- CHECK AUTH ---------------------- */
export const checkAuth = asyncHandler(async (req, res) => {
  const userId = req.id;
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      fullname: true,
      email: true,
      phoneNumber: true,
      profilePicture: true,
      admin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json({ success: true, user });
});

/* ---------------------- UPDATE PROFILE ---------------------- */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.id;
  const { fullname, email, contact, phoneNumber, profilePicture } = req.body;

  const phoneToSave = (phoneNumber || contact || "").trim();

  // upload image on cloudinary if data URI
  let uploadedImage = null;
  if (profilePicture && profilePicture.startsWith("data:")) {
    try {
      const cloudResponse = await cloudinary.uploader.upload(profilePicture);
      uploadedImage = cloudResponse.secure_url;
    } catch (err) {
      console.warn("Cloudinary upload failed, keeping base64/fallback image:", err);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: Number(userId) },
    data: {
      fullname: fullname ? fullname.trim() : undefined,
      email: email || undefined,
      phoneNumber: phoneToSave || undefined,
      profilePicture: uploadedImage || profilePicture || undefined,
    },
    select: {
      id: true,
      fullname: true,
      email: true,
      phoneNumber: true,
      profilePicture: true,
      admin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!updatedUser)
    throw new AppError(
      "Please make sure all the fields are filled correctly",
      400
    );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});
