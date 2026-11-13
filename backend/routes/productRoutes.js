
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
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

// VIEW PRODUCTS OF LOGGED-IN FARMER
router.get("/my-products", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can view their products"
      });
    }

    const products = await Product.find({
      farmer: req.user.userId
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// VIEW ALL PRODUCTS WITH PUBLIC FARMER DETAILS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate(
        "farmer",
        "name phone farmAddress farmDescription"
      );

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// ADD A PRODUCT REVIEW
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can submit reviews"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const { rating, comment } = req.body;

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5 ||
      !comment ||
      !comment.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a rating between 1 and 5 and a comment"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Prevent farmers from reviewing their own products
    if (product.farmer.toString() === req.user.userId) {
      return res.status(403).json({
        message: "You cannot review your own product"
      });
    }

    // Check whether the buyer has received this product
    const deliveredOrder = await Order.findOne({
      buyer: req.user.userId,
      items: {
        $elemMatch: {
          product: product._id,
          status: "Delivered"
        }
      }
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        message: "You can review a product only after it has been delivered"
      });
    }

    // Prevent duplicate reviews from the same buyer
    const alreadyReviewed = product.reviews.some(
      (review) => review.buyer.toString() === req.user.userId
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this product"
      });
    }

    const buyer = await User.findById(req.user.userId).select("name");

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found"
      });
    }

    const review = {
      buyer: req.user.userId,
      buyerName: buyer.name,
      rating: Number(rating),
      comment: comment.trim()
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.averageRating =
      product.reviews.reduce(
        (total, review) => total + review.rating,
        0
      ) / product.numReviews;

    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      product
    });
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
