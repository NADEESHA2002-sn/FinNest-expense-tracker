const authService = require("../services/authService");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      ...result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyResetCode(email, code);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
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
