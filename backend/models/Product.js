
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    unit: {
      type: String,
      required: true,
      enum: ["kg", "gram", "quintal", "tonne", "piece", "litre"]
    },

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Product Reviews
    reviews: [
      {
        buyer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },

        buyerName: {
          type: String,
          required: true
        },

        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
        },

        comment: {
          type: String,
          required: true,
          trim: true
        }
      }
    ],

    // Average Rating
    averageRating: {
      type: Number,
      default: 0
    },

    // Total Number of Reviews
    numReviews: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);
