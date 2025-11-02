const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bundleId: { type: mongoose.Schema.Types.ObjectId, ref: "Bundle" },
    pricePaid: Number,
    tokensUsed: { type: Number, default: 0 },
    paymentProvider: String,
    providerPaymentId: String, // razorpay order id or payment id
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    refChain: [
        { userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, level: Number, amount: Number }
    ],
    processedProviderEventId: { type: String }, // store razorpay event id to ensure idempotency
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Purchase", PurchaseSchema);
