import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    const newUser = new User({
      fullName,
      username,
      email,
      password,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImage: newUser.profileImage,
        coverImage: newUser.coverImage,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error is signup function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Password Checker
    const isPasswordCorrect = await existingUser.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    generateTokenAndSetCookie(existingUser._id, res);

    res.status(200).json({
      message: "Login Successfull",
      _id: existingUser._id,
      fullName: existingUser.fullName,
      username: existingUser.username,
      email: existingUser.email,
      followers: existingUser.followers,
      following: existingUser.following,
      profileImage: existingUser.profileImage,
      coverImage: existingUser.coverImage,
    });
  } catch (error) {
    console.log("Error is login function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error is logout function", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getMe function", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
