const User = require("../models/User");

const findByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase().trim() });
};

const findById = async (id) => {
  return await User.findById(id);
};

const create = async (userData) => {
  const user = new User({
    ...userData,
    email: userData.email.toLowerCase().trim()
  });
  return await user.save();
};

const updateById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).select("-password");
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateById
};
