const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    profilePic: {
      type: String,
      default: "👨‍💼"
    },
    currency: {
      type: String,
      default: "Rs."
    },
    monthlyBudget: {
      type: Number,
      default: 100000
    },
    bio: {
      type: String,
      default: "Personal finance enthusiast"
    },
    resetPasswordOtp: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON representation (strips password & sensitive OTP fields)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
