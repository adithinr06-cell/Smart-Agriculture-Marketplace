
const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ADD PRODUCT TO CART
router.post("/add", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can add products to the cart"
      });
    }

    const { productId, quantity } = req.body;

    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        message: "Please provide a valid product ID and quantity"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (product.farmer.toString() === req.user.userId) {
      return res.status(400).json({
        message: "Farmers cannot add their own products to the cart"
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        message: "Not enough stock available"
      });
    }

    let cart = await Cart.findOne({
      buyer: req.user.userId
    });

    if (!cart) {
      cart = new Cart({
        buyer: req.user.userId,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > product.quantity) {
        return res.status(400).json({
          message: "Not enough stock available"
        });
      }

      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity
      });
    }

    await cart.save();

    res.status(200).json({
      message: "Product added to cart successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

/* VIEW BUYER CART */
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can view their cart"
      });
    }

    const cart = await Cart.findOne({
      buyer: req.user.userId
    }).populate(
      "items.product",
      "name category price unit"
    );

    if (!cart) {
      return res.json({
        message: "Your cart is empty",
        items: []
      });
    }

    res.json({
      message: "Cart retrieved successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

/* REMOVE PRODUCT FROM CART */
router.delete("/remove/:productId", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can remove products from the cart"
      });
    }

    const { productId } = req.params;

    const cart = await Cart.findOne({
      buyer: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in cart"
      });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.json({
      message: "Product removed from cart successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});
/* UPDATE CART ITEM QUANTITY */
router.put("/update/:productId", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can update cart quantities"
      });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive integer"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({
        message: "Not enough stock available"
      });
    }

    const cart = await Cart.findOne({
      buyer: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart"
      });
    }

    item.quantity = quantity;

    await cart.save();

    res.json({
      message: "Cart quantity updated successfully",
      cart
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});
module.exports = router;
