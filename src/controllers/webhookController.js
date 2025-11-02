const { verifyWebhookSignature } = require("../utils/razorpay");
const Purchase = require("../models/Purchase");
const Transaction = require("../models/Transaction");
const { distributeCommissionsForPurchase } = require("../utils/referral");

// Razorpay sends a JSON body; we verify using rawBody and header 'x-razorpay-signature'
exports.razorpayWebhook = async (req, res) => {
    const rawBody = req.rawBody;
    const signature = req.headers["x-razorpay-signature"];

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
        console.warn("Invalid razorpay webhook signature");
        return res.status(400).send("invalid signature");
    }

    let event = null;
    try {
        event = JSON.parse(rawBody);
    } catch (err) {
        console.error("Invalid JSON", err);
        return res.status(400).send("invalid json");
    }

    // Process only payment captured events (or others as needed)
    if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;

        // We used order_id in purchase.providerPaymentId
        const orderId = payment.order_id;
        const purchase = await Purchase.findOne({ providerPaymentId: orderId });
        if (!purchase) {
            return res.status(200).send("no-purchase");
        }

        // Idempotency: check if processed
        if (purchase.processedProviderEventId === event.id) {
            return res.status(200).send("already-processed");
        }

        // mark purchase completed and distribute commissions
        purchase.processedProviderEventId = event.id;
        purchase.status = "completed";
        purchase.pricePaid = purchase.pricePaid; // already set
        await purchase.save();

        try {
            await distributeCommissionsForPurchase(purchase);
        } catch (err) {
            console.error("commission error", err);
        }

        return res.status(200).send("ok");
    }

    // Other events: ignore
    res.status(200).send("ignored event");
};
