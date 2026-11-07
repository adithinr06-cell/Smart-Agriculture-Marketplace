
const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Calculate overall order status from individual product statuses
const updateOverallStatus = (order) => {
  const statuses = order.items.map(item => item.status || "Placed");

  if (statuses.every(status => status === "Cancelled")) {
    order.status = "Cancelled";
    return;
  }

  const statusRank = {
    Placed: 1,
    Confirmed: 2,
    Shipped: 3,
    Delivered: 4,
    Cancelled: 5
  };

  const overallStatus = {
    1: "Placed",
    2: "Confirmed",
    3: "Shipped",
    4: "Delivered"
  };

  const activeStatuses = statuses.filter(
    status => status !== "Cancelled"
  );

  const minimumRank = Math.min(
    ...activeStatuses.map(status => statusRank[status] || 1)
  );

  order.status = overallStatus[minimumRank] || "Placed";
};

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
        price: product.price,
        status: "Placed"
      });

      totalAmount += product.price * item.quantity;
    }

    // Reduce stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      product.quantity -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      buyer: req.user.userId,
      items: orderItems,
      totalAmount,
      status: "Placed"
    });

    // Clear cart
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

// VIEW BUYER ORDERS
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

// CANCEL ORDER
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

    // Cancellation is allowed only while every item is Placed or Confirmed
    const canCancel = order.items.every(item =>
      item.status === "Placed" || item.status === "Confirmed"
    );

    if (!canCancel) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "This order can no longer be cancelled because one or more products have been shipped"
      });
    }

    // Restore stock and cancel every item
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error("A product in this order no longer exists");
      }

      product.quantity += item.quantity;
      await product.save({ session });

      item.status = "Cancelled";
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

// VIEW FARMER ORDERS
router.get("/farmer-orders", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can view incoming orders"
      });
    }

    const farmerProducts = await Product.find({
      farmer: req.user.userId
    }).select("_id");

    const productIds = farmerProducts.map(product => product._id);

    const orders = await Order.find({
      "items.product": { $in: productIds }
    })
      .populate("buyer", "name email")
      .populate("items.product", "name price unit farmer")
      .sort({ createdAt: -1 });

    const farmerOrders = orders.map(order => {
      const orderObject = order.toObject();

      // Show only this farmer's products
      orderObject.items = orderObject.items.filter(
        item =>
          item.product &&
          item.product.farmer &&
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

// UPDATE STATUS OF ONE SELECTED FARMER PRODUCT
router.put("/update-status/:orderId", protect, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can update order status"
      });
    }

    const { status, productId } = req.body;

    const allowedStatuses = [
      "Confirmed",
      "Shipped",
      "Delivered"
    ];

    if (!allowedStatuses.includes(status) || !productId) {
      return res.status(400).json({
        message: "Product ID and valid order status are required"
      });
    }

    const order = await Order.findById(req.params.orderId)
      .populate("items.product", "farmer");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const nextStatus = {
      Placed: "Confirmed",
      Confirmed: "Shipped",
      Shipped: "Delivered"
    };

    // Find only the selected product in this order
    const selectedItem = order.items.find(item =>
      item.product &&
      item.product._id.toString() === productId
    );

    if (!selectedItem) {
      return res.status(404).json({
        message: "Product not found in this order"
      });
    }

    // Verify that the selected product belongs to this farmer
    if (
      !selectedItem.product.farmer ||
      selectedItem.product.farmer.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        message: "You can only update your own products"
      });
    }

    const currentStatus = selectedItem.status || "Placed";

    if (nextStatus[currentStatus] !== status) {
      return res.status(400).json({
        message: `This product cannot be changed from ${currentStatus} to ${status}`
      });
    }

    // Update only the selected product
    selectedItem.status = status;

    // Recalculate overall order status
    updateOverallStatus(order);

    await order.save();

    res.json({
      message: "Product order status updated successfully",
      updatedCount: 1,
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
