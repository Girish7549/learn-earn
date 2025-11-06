const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    bundleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bundle"
    },
    pricePaid: {
        type: Number
    },
    commision: {
        type: Number
    },
    tokensUsed: {
        type: Number, default: 0
    },
    paymentProvider: {
        type: String
    },
    providerPaymentId: {
        type: String
    }, // razorpay order id or payment id
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    refChain: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            level: Number,
            amount: Number
        }
    ],
    processedProviderEventId: { // store razorpay event id to ensure idempotency
        type: String
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    purchasedBundles: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bundle"
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Purchase", PurchaseSchema);
