const Purchase = require("../models/Purchase");
const Bundle = require("../models/Bundle");
const User = require("../models/User");
const { createOrder } = require("../utils/razorpay");

// Create purchase: validate, create Purchase doc and create Razorpay order if amount>0
exports.createPurchase = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bundleId } = req.body;

        // validate
        const bundle = await Bundle.findById(bundleId);
        if (!bundle) return res.status(400).json({ error: "Invalid bundle" });

        // price
        const price = bundle.price;

        // create purchase doc (pending -> completed will be set after webhook)
        const purchase = await Purchase.create({
            userId,
            bundleId,
            pricePaid: price,
            status: "pending"
        });

        // create razorpay order
        const receipt = `purchase_${purchase._id.toString()}`;
        const order = await createOrder(price, receipt);

        // save provider order id
        purchase.paymentProvider = "razorpay";
        purchase.providerPaymentId = order.id; // razorpay order id
        await purchase.save();

        res.json({ purchase, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
