const User = require("../models/User");
const Unit = require("../models/Unit");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token");

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true }).select(
      "+password +refreshToken"
    ).populate("unit", "name slug");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id, user.role, user.unit?._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        unit: user.unit,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select("+refreshToken").populate("unit", "name slug");

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const accessToken = generateAccessToken(user._id, user.role, user.unit?._id);
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+refreshToken");
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/admin  (superadmin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, unitId } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "Email already in use" });

    const admin = await User.create({ name, email, password, role: "admin", unit: unitId });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email, unit },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("unit", "name slug");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { login, refresh, logout, createAdmin, getMe };