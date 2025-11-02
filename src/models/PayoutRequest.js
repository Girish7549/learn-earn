const mongoose = require("mongoose");

const PayoutRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    processedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PayoutRequest", PayoutRequestSchema);
