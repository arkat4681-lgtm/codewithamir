import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// ==== MONGO CONNECTION ====
mongoose
  .connect("mongodb+srv://arkat4681_db_user:EGgjHlHjmlb3Wz3t@cluster0.kiijqyu.mongodb.net/?")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ==== MULTER (IMAGE UPLOAD) ====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ==== USER MODEL ====
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  photo: String
});
const User = mongoose.model("User", userSchema);

// ==== REGISTER ====
app.post("/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Account already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, phone });
    await user.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// ==== LOGIN ====
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "secretkey");
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Login successful", redirect: "/dashboard.html" });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

// ==== PROFILE IMAGE UPLOAD ====
app.post("/upload-photo", upload.single("photo"), async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, "secretkey");

    const user = await User.findByIdAndUpdate(decoded.id, { photo: `/uploads/${req.file.filename}` }, { new: true });
    res.json({ message: "Photo updated", photo: user.photo });
  } catch (err) {
    res.status(500).json({ message: "Error uploading photo" });
  }
});

// ==== GET PROFILE DATA ====
app.get("/user", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, "secretkey");

    const user = await User.findById(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

// ==== LOGOUT ====
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ==== START SERVER ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
