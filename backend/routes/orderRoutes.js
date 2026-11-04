const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
const mongoose = require("mongoose");
// PLACE ORDER
router.post("/place", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can place orders"
      });
    }

    const cart = await Cart.findOne({
      buyer: req.user.userId
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty"
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Validate products and stock before creating the order
    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({
          message: "A product in your cart no longer exists"
        });
      }

      if (product.farmer.toString() === req.user.userId) {
        return res.status(400).json({
          message: "You cannot order your own product"
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Reduce stock and save each product
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      product.quantity -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      buyer: req.user.userId,
      items: orderItems,
      totalAmount
    });

    // Clear the cart after successful order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Order placed successfully",
      order
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});
/* VIEW MY ORDERS */
router.get("/my-orders", protect, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can view their orders"
      });
    }

    const orders = await Order.find({
      buyer: req.user.userId
    })
      .populate("items.product", "name category price unit")
      .sort({ createdAt: -1 });

    res.json({
      message: "Orders retrieved successfully",
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});
/* CANCEL ORDER */
router.put("/cancel/:orderId", protect, async (req, res) => {
  const session = await Order.startSession();

  try {
    session.startTransaction();

    if (req.user.role !== "buyer") {
      await session.abortTransaction();
      return res.status(403).json({
        message: "Only buyers can cancel orders"
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      buyer: req.user.userId
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status !== "Placed" && order.status !== "Confirmed") {
      await session.abortTransaction();
      return res.status(400).json({
        message: "This order can no longer be cancelled"
      });
    }

    // Restore stock for every product in the order
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error("A product in this order no longer exists");
      }

      product.quantity += item.quantity;
      await product.save({ session });
    }

    order.status = "Cancelled";
    await order.save({ session });

    await session.commitTransaction();

    res.json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  } finally {
    await session.endSession();
  }
});

/* VIEW FARMER ORDERS */
router.get("/farmer-orders", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can view incoming orders"
      });
    }

    // Find products belonging to the logged-in farmer
    const farmerProducts = await Product.find({
      farmer: req.user.userId
    }).select("_id");

    const productIds = farmerProducts.map(product => product._id);

    // Find orders containing those products
    const orders = await Order.find({
      "items.product": { $in: productIds }
    })
      .populate("buyer", "name email")
      .populate("items.product", "name price unit farmer")
      .sort({ createdAt: -1 });

    // Show only the farmer's own products in each order
    const farmerOrders = orders.map(order => {
      const orderObject = order.toObject();

      orderObject.items = orderObject.items.filter(
        item =>
          item.product &&
          item.product.farmer.toString() === req.user.userId
      );

      return orderObject;
    });

    res.json({
      message: "Farmer orders retrieved successfully",
      count: farmerOrders.length,
      orders: farmerOrders
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

/* UPDATE ORDER STATUS */
router.put("/update-status/:orderId", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can update order status"
      });
    }

    const { status } = req.body;

    const allowedStatuses = [
      "Confirmed",
      "Shipped",
      "Delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const order = await Order.findById(req.params.orderId)
      .populate("items.product", "farmer");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // Check whether all products belong to this farmer
    const isOwner = order.items.every(
      item =>
        item.product &&
        item.product.farmer.toString() === req.user.userId
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "You are not authorized to update this order"
      });
    }

    // Allow only the next status in the sequence
    const nextStatus = {
      Placed: "Confirmed",
      Confirmed: "Shipped",
      Shipped: "Delivered"
    };

    if (nextStatus[order.status] !== status) {
      return res.status(400).json({
        message: "Invalid status transition"
      });
    }

    order.status = status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});
module.exports = router;