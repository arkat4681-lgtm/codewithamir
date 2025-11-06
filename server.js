// server.js
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://aaamir4682_db_user:EyrZZAqMMH1zG2Zz@cluster0.tyegtk6.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", userSchema);

// ✅ Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Signup Route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Account already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Signup successful!" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error signing up!" });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password!" });

    res.status(200).json({ message: "Login successful!" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error logging in!" });
  }
});

// ✅ Logout Route (optional)
app.get("/logout", (req, res) => {
  res.json({ message: "Logged out successfully!" });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
