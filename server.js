// server.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, "users.json");

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Utility: read/write users.json
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    return [];
  }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// POST /api/signup
app.post("/api/signup", async (req, res) => {
  const { name, email, phone, country, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password required." });
  }

  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "Email already registered." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    phone: phone || "",
    country: country || "",
    password: hashed,
    token: null,
    joinedAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  return res.json({ message: "Signup successful." });
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });

  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials." });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials." });

  const token = crypto.randomBytes(24).toString("hex");
  user.token = token;
  writeUsers(users);

  return res.json({
    message: "Login successful.",
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, country: user.country },
  });
});

// GET /api/user  (protected)
app.get("/api/user", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided." });

  const users = readUsers();
  const user = users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ error: "Invalid token." });

  return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, country: user.country });
});

// GET /api/logout
app.get("/api/logout", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return res.json({ message: "Logged out." });

  const users = readUsers();
  const user = users.find((u) => u.token === token);
  if (user) {
    user.token = null;
    writeUsers(users);
  }
  return res.json({ message: "Logged out." });
});

// Fallback: serve index.html for other GET (SPA-friendly)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
