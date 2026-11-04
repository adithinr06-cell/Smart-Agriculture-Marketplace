
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const protect = require("./middleware/authMiddleware");
const productRoutes = require("./routes/productRoutes");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const farmerProfileRoutes = require("./routes/farmerProfileRoutes");

const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/farmer-profile", farmerProfileRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Smart Agriculture Marketplace API is running...");
});

app.get("/api/auth/protected", protect, (req, res) => {
  res.json({
    message: "Access granted!",
    user: req.user
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
