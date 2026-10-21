const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const emailService = require("./emailService");

const JWT_SECRET = process.env.JWT_SECRET || "lifeapp_super_secret_jwt_key_2026_finance_tracker";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const register = async ({ name, email, password, phone }) => {
  if (!name || !name.trim()) {
    throw new Error("Full name is required");
  }
  if (!email || !email.trim()) {
    throw new Error("Valid email address is required");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const newUser = await userRepository.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone ? phone.trim() : "",
    profilePic: "👨‍💼",
    currency: "Rs.",
    monthlyBudget: 100000,
    bio: "FinNest member."
  });

  const token = generateToken(newUser);

  return {
    user: newUser.toSafeObject(),
    token
  };
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new Error("Please provide both email and password");
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error("No account found with this email address.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Incorrect password. Please verify and try again.");
  }

  const token = generateToken(user);

  return {
    user: user.toSafeObject(),
    token
  };
};

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user.toSafeObject();
};

const updateProfile = async (userId, updates) => {
  const allowed = ["name", "phone", "profilePic", "currency", "monthlyBudget", "bio"];
  const filtered = {};

  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      filtered[field] = updates[field];
    }
  });

  const updatedUser = await userRepository.updateById(userId, filtered);
  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error("Current and new passwords are both required");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long");
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error("Current password does not match our records");
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password updated successfully" };
};

const forgotPassword = async (email) => {
  if (!email || !email.trim()) {
    throw new Error("Please provide your registered email address");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error("No FinNest account found with this email address");
  }

  // Generate a secure 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Code is valid for 10 minutes
  user.resetPasswordOtp = code;
  user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // Send the OTP to the user's Gmail address
  const emailResult = await emailService.sendResetCodeEmail(user.email, code, user.name);

  return {
    message: emailResult.sent
      ? `A 6-digit verification code has been sent to your Gmail (${user.email}). Please check your inbox and spam folder.`
      : `Verification code generated for ${user.email}. (SMTP credentials not yet configured in backend .env; use the code below to test).`,
    email: user.email,
    sentToEmail: !!emailResult.sent,
    devCode: code
  };
};

const verifyResetCode = async (email, code) => {
  if (!email || !code) {
    throw new Error("Email and 6-digit verification code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error("No account found with this email address");
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== String(code).trim()) {
    throw new Error("Invalid verification code. Please check your email and try again.");
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new Error("Verification code has expired. Please request a new code.");
  }

  return { message: "Verification code confirmed. You can now set your new password." };
};

const resetPassword = async (email, code, newPassword) => {
  if (!email || !code || !newPassword) {
    throw new Error("Email, verification code, and new password are required");
  }

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw new Error("No account found with this email address");
  }

  if (!user.resetPasswordOtp || user.resetPasswordOtp !== String(code).trim()) {
    throw new Error("Invalid verification code. Please request a new code or re-enter.");
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw new Error("Verification code has expired. Please request a new one.");
  }

  user.password = newPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: "Password updated successfully! You can now sign in with your new password." };
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
