// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const Purchase = require("../models/Purchase");
// const Bundle = require("../models/Bundle");
// const User = require("../models/User");
// const Transaction = require("../models/Transaction");

// // Initialize Razorpay
// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // ===============================
// // 1️⃣ Create Order
// // ===============================
// exports.createPurchase = async (req, res) => {
//     try {
//         const { bundleId } = req.body;
//         const bundle = await Bundle.findById(bundleId);
//         if (!bundle) return res.status(404).json({ error: "Bundle not found" });

//         const options = {
//             amount: bundle.price * 100, // in paise
//             currency: "INR",
//             receipt: "rcpt_" + Date.now(),
//         };

//         const order = await razorpay.orders.create(options);

//         // Save a pending purchase record
//         const purchase = await Purchase.create({
//             userId: req.user.id,
//             bundleId: bundleId,
//             pricePaid: bundle.price,
//             paymentProvider: "razorpay",
//             providerPaymentId: order.id,
//             status: "pending"
//         });

//         res.json({
//             orderId: order.id,
//             amount: order.amount,
//             currency: order.currency,
//             purchaseId: purchase._id,
//             key: process.env.RAZORPAY_KEY_ID
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Order creation failed" });
//     }
// };

// // ===============================
// // 2️⃣ Verify Payment (called from frontend after success)
// // ===============================
// exports.verifyPayment = async (req, res) => {
//     try {
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//         // verify signature
//         const generatedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(razorpay_order_id + "|" + razorpay_payment_id)
//             .digest("hex");

//         if (generatedSignature !== razorpay_signature) {
//             return res.status(400).json({ error: "Invalid payment signature" });
//         }

//         // Mark purchase as completed
//         const purchase = await Purchase.findOneAndUpdate(
//             { providerPaymentId: razorpay_order_id },
//             { status: "completed", isPaid: true },
//             { new: true }
//         );

//         if (!purchase) return res.status(404).json({ error: "Purchase not found" });

//         // Distribute referral commissions
//         await distributeCommissions(purchase.userId, purchase._id, purchase.pricePaid);

//         res.json({ success: true, message: "Payment verified and purchase completed" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Payment verification failed" });
//     }
// };

// // ===============================
// // 3️⃣ Commission Distribution
// // ===============================
// async function distributeCommissions(buyerId, purchaseId, amount) {
//     const LEVEL_PERCENTS = [0.10, 0.05, 0.03]; // 10%, 5%, 3%

//     let currentUser = await User.findById(buyerId).populate("referredBy");

//     for (let level = 0; level < LEVEL_PERCENTS.length; level++) {
//         if (!currentUser?.referredBy) break;

//         const referrer = await User.findById(currentUser.referredBy);
//         if (!referrer) break;

//         const commission = amount * LEVEL_PERCENTS[level];
//         referrer.earningsBalance += commission;
//         referrer.totalEarnings += commission;
//         await referrer.save();

//         await Transaction.create({
//             type: "commission",
//             fromPurchaseId: purchaseId,
//             toUserId: referrer._id,
//             amount: commission,
//             level: level + 1,
//             description: `Level ${level + 1} commission from user ${buyerId}`,
//         });

//         currentUser = referrer; // move up in chain
//     }
// }


// // =============================
// // 3️⃣ Get My Purchases
// // =============================
// exports.getMyPurchases = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const purchases = await Purchase.find({ userId }).populate("bundleId");
//         res.json(purchases);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// };

// // =============================
// // 4️⃣ Admin: Get All Purchases
// // =============================
// exports.getAllPurchases = async (req, res) => {
//     try {
//         const purchases = await Purchase.find()
//             .populate("userId", "name email")
//             .populate("bundleId", "name price");
//         res.json(purchases);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// };

// // =============================
// // 5️⃣ Admin: Update Status Manually (Optional)
// // =============================
// exports.updatePurchaseStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;
//         const updated = await Purchase.findByIdAndUpdate(id, { status }, { new: true });
//         res.json(updated);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Server error" });
//     }
// };


const Razorpay = require("razorpay");
const crypto = require("crypto");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Bundle = require("../models/Bundle");
const Transaction = require("../models/Transaction");

// ✅ Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// 🟢 1️⃣ Create Purchase (Generate Razorpay Order)
// =====================================================
exports.createPurchase = async (req, res) => {
    try {
        const { bundleId } = req.body;
        const userId = req.user._id;

        const bundle = await Bundle.findById(bundleId);
        if (!bundle) return res.status(404).json({ error: "Bundle not found" });

        // Create Razorpay Order
        const order = await razorpay.orders.create({
            amount: bundle.price * 100, // in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId.toString(),
                bundleId: bundleId.toString()
            }
        });

        // Save in DB
        const purchase = await Purchase.create({
            userId,
            bundleId,
            pricePaid: bundle.price,
            purchasedBundles: bundleId,
            paymentProvider: "razorpay",
            providerPaymentId: order.id,
            status: "pending",
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: bundle.price * 100,
            currency: "INR",
            key: process.env.RAZORPAY_KEY_ID,
            checkoutUrl: `https://api.razorpay.com/v1/checkout/embedded?order_id=${order.id}&key_id=${process.env.RAZORPAY_KEY_ID}`

        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error creating order" });
    }
};

// =====================================================
// 🟢 2️⃣ Verify Payment (Frontend calls this after success)
// =====================================================
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        // Verify signature
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpay_signature)
            return res.status(400).json({ error: "Invalid payment signature" });

        // Update Purchase
        const purchase = await Purchase.findOne({ providerPaymentId: razorpay_order_id });
        if (!purchase) return res.status(404).json({ error: "Purchase not found" });

        if (purchase.status === "completed") {
            return res.json({ success: true, message: "Already verified" });
        }

        purchase.status = "completed";
        purchase.isPaid = true;
        await purchase.save();

        // ✅ Handle Commission Logic Based on Bundle Comparison
        const user = await User.findById(userId);
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);

            if (referrer) {
                // Get the buyer's bundle (the one they just purchased)
                const purchaseBundle = await Bundle.findById(purchase.bundleId);
                if (!purchaseBundle) {
                    console.warn(`Bundle not found for purchase ${purchase._id}`);
                } else {
                    // ✅ Find referrer’s latest completed purchase
                    const referrerPurchase = await Purchase.findOne({
                        userId: referrer._id,
                        status: "completed",
                        isPaid: true
                    }).sort({ createdAt: -1 });

                    if (!referrerPurchase) {
                        console.warn(`Referrer ${referrer._id} has no completed purchase.`);
                    } else {
                        const referrerBundle = await Bundle.findById(referrerPurchase.bundleId);
                        if (!referrerBundle) {
                            console.warn(`Referrer bundle not found for ${referrer._id}`);
                        } else {
                            // Extract commission values
                            const referrerCommission = Number(referrerBundle.commision) || 0;
                            const buyerCommission = Number(purchaseBundle.commision) || 0;

                            // Apply your business rule:
                            let finalCommission = 0;
                            if (buyerCommission >= referrerCommission) {
                                // Buyer’s bundle is same or higher
                                finalCommission = referrerCommission;
                            } else {
                                // Buyer’s bundle is lower
                                finalCommission = buyerCommission;
                            }

                            if (finalCommission > 0) {
                                // Update referrer’s earnings
                                const currentBalance = Number(referrer.earningsBalance) || 0;
                                const currentTotal = Number(referrer.totalEarnings) || 0;

                                referrer.earningsBalance = currentBalance + finalCommission;
                                referrer.totalEarnings = currentTotal + finalCommission;
                                await referrer.save();

                                // Record transaction
                                await Transaction.create({
                                    type: "commission",
                                    fromPurchaseId: purchase._id,
                                    toUserId: referrer._id,
                                    amount: finalCommission,
                                    level: 1,
                                    description: `Commission earned from ${user.email}`,
                                });

                                console.log(
                                    `Commission of ₹${finalCommission} awarded to referrer ${referrer._id}`
                                );
                            } else {
                                console.warn(
                                    `Invalid commission calculated: ${finalCommission} for referrer ${referrer._id}`
                                );
                            }
                        }
                    }
                }
            }
        }


        res.json({ success: true, message: "Payment verified successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error verifying payment" });
    }
};

// =====================================================
// 🟢 3️⃣ Get User Purchases
// =====================================================
exports.getMyPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ userId: req.user._id })
            .populate("bundleId")
            .sort({ createdAt: -1 });

        res.json({ success: true, purchases });
    } catch (err) {
        res.status(500).json({ error: "Error fetching purchases" });
    }
};

// =====================================================
// 🟢 4️⃣ Admin - Get All Purchases
// =====================================================
exports.getAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find()
            .populate("userId bundleId")
            .sort({ createdAt: -1 });
        res.json({ success: true, purchases });
    } catch (err) {
        res.status(500).json({ error: "Error fetching all purchases" });
    }
};

// =====================================================
// 🟢 5️⃣ Admin - Update Purchase Status
// =====================================================
exports.updatePurchaseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isPaid } = req.body;
        const purchase = await Purchase.findByIdAndUpdate(id, { status, isPaid }, { new: true });
        if (!purchase) return res.status(404).json({ error: "Purchase not found" });
        res.json({ success: true, purchase });
    } catch (err) {
        res.status(500).json({ error: "Error updating purchase status" });
    }
};

// =====================================================
// 🟢 5️⃣ Admin - Delete Purchase Status
// =====================================================
exports.deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByIdAndDelete(id);
        if (!purchase) return res.status(404).json({ error: "Purchase not found" });
        res.json({ success: true, purchase });
    } catch (err) {
        res.status(500).json({ error: "Error updating purchase status" });
    }
};
