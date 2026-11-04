
const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// GET FARMER PROFILE
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Access denied. Farmers only."
      });
    }

    const farmer = await User.findById(req.user.userId).select(
      "-password"
    );

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found"
      });
    }

    res.json({
      message: "Farmer profile fetched successfully",
      farmer
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// UPDATE FARMER PROFILE
router.put("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Access denied. Farmers only."
      });
    }

    const { name, phone, farmAddress, farmDescription } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Farmer name is required"
      });
    }

    const farmer = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name: name.trim(),
        phone: phone || "",
        farmAddress: farmAddress || "",
        farmDescription: farmDescription || ""
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    ).select("-password");

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found"
      });
    }

    res.json({
      message: "Profile updated successfully",
      farmer
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;
