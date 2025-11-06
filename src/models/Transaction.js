const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["commission", "purchase", "payout", "refund"],
        required: true
    },
    fromPurchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase"
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    amount: Number,
    level: Number,
    description: String,
    providerEventId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
