import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Notice from "../models/notis.js";
import User from "../models/userModel.js";

// Helper function to generate JWT and set it as an HTTP-only cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
};

// POST request - login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("🔹 Received Login Request:", { email, password });

  const user = await User.findOne({ email });

  if (!user) {
    console.log("❌ User not found for email:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.isActive) {
    console.log("❌ Account Deactivated for:", email);
    return res.status(401).json({ message: "User account is deactivated" });
  }

  console.log("🔹 Checking Password...");
  const isMatch = await user.matchPassword(password);
  console.log("🔹 Password Match:", isMatch);

  if (!isMatch) {
    console.log("❌ Incorrect Password for:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  console.log("✅ Login Successful for:", email);
  generateTokenAndSetCookie(res, user._id);
  res.json({
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      title: user.title,
    },
  });
  
});


// POST - Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin, role, title } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res
      .status(400)
      .json({ status: false, message: "Email address already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    isAdmin,
    role,
    title,
  });

  if (user) {
    if (isAdmin) generateTokenAndSetCookie(res, user._id);
    res.status(201).json({ status: true, message: "User registered successfully" });
  } else {
    return res.status(400).json({ status: false, message: "Invalid user data" });
  }
});

// POST - Logout user / clear cookie
const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ status: true, message: "Logged out successfully" });
};
const getUserTaskStatus = asyncHandler(async (req, res) => {
  const tasks = await User.find()
    .populate("tasks", "title stage")
    .sort({ _id: -1 });

  res.status(200).json(tasks);
});

// GET - Get team list with search functionality
const getTeamList = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query).select("name title role email isActive");
  res.status(200).json(users);
});

// GET - Get user notifications
const getNotificationsList = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const notices = await Notice.find({
    team: userId,
    isRead: { $nin: [userId] },
  })
    .populate("task", "title")
    .sort({ _id: -1 });

  res.status(200).json(notices);
});

// PUT - Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { _id, name, title, role } = req.body;

  const id = isAdmin ? _id || userId : userId;
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  user.name = name || user.name;
  user.title = title || user.title;
  user.role = role || user.role;

  await user.save();
  res.status(200).json({ status: true, message: "Profile Updated Successfully." });
});

// PUT - Activate/deactivate user profile
const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    status: true,
    message: `User account has been ${isActive ? "activated" : "disabled"}`,
  });
});

// PUT - Change user password
const changeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { password } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ status: false, message: "User not found" });
  }

  user.password = password;
  await user.save();

  res.status(200).json({ status: true, message: "Password changed successfully." });
});

// DELETE - Delete user account
const deleteUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await User.findByIdAndDelete(id);
  res.status(200).json({ status: true, message: "User deleted successfully" });
});

// GET - Mark notifications as read
const markNotificationRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } }
      );
    } else {
      await Notice.findByIdAndUpdate(
        id,
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    res.status(200).json({ status: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
});

export {
  activateUserProfile,
  changeUserPassword,
  deleteUserProfile,
  getNotificationsList,
  getUserTaskStatus, 
  getTeamList,
  loginUser,
  logoutUser,
  markNotificationRead,
  registerUser,
  updateUserProfile,
};
