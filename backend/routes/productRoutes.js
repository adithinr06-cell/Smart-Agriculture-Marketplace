
const express = require("express");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ADD A PRODUCT
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can add products"
      });
    }

    const { name, description, category, price, quantity, unit } = req.body;

    if (
      !name ||
      !description ||
      !category ||
      price === undefined ||
      quantity === undefined ||
      !unit
    ) {
      return res.status(400).json({
        message: "Please fill all product fields"
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      quantity,
      unit,
      farmer: req.user.userId
    });

    res.status(201).json({
      message: "Product added successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// VIEW ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("farmer", "name");

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

/* UPDATE A PRODUCT */
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can update products"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.farmer.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You can update only your own products"
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "quantity",
      "unit"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    await product.save();

    res.json({
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

/* DELETE A PRODUCT */
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can delete products"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.farmer.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You can delete only your own products"
      });
    }

    await product.deleteOne();

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;
