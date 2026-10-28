const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Role is never taken from the request body; only ADMIN_EMAIL gets admin.
    const role =
      process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "user";

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      message: "Registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
exports.me = (req, res) => {
  const { _id, name, email, role, createdAt } = req.user;
  res.json({ user: { id: _id, name, email, role, createdAt } });
};
