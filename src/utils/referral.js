// computes and applies commission distribution per your rules:
// Level1 = 45% per referral (so two referrals => 90% recovery)
// Level2 = 5%
// Level3 = 2%
// chain capped at 3 levels
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Purchase = require("../models/Purchase");

// Level percents
const LEVEL1_PERCENT = 45;
const LEVEL2_PERCENT = 5;
const LEVEL3_PERCENT = 2;

// Main function: given a completed purchase, compute & create transactions + update earnings
async function distributeCommissionsForPurchase(purchase) {
    const buyer = await User.findById(purchase.userId);
    if (!buyer) return;

    const bundlePrice = purchase.pricePaid; // we use bundle.price or purchase.pricePaid (price policy)
    // The business choice here: commissions are based on full bundle price.
    // If you want commissions based on net paid (after tokens), change to net amount.

    const fullPrice = bundlePrice; // if purchase stores full bundle price, use that

    const chain = [];

    // Level 1: direct referrer of buyer
    let level1Id = buyer.referredBy;
    if (level1Id) {
        const u1 = await User.findById(level1Id);
        if (u1) {
            const amount1 = Math.round((fullPrice * LEVEL1_PERCENT) / 100);
            // create transaction
            await Transaction.create({
                type: "commission",
                fromPurchaseId: purchase._id,
                toUserId: u1._id,
                amount: amount1,
                level: 1,
                description: `Direct commission ${LEVEL1_PERCENT}%`
            });
            // credit user
            await User.findByIdAndUpdate(u1._id, {
                $inc: { earningsBalance: amount1, totalEarnings: amount1, successfulReferrals: 1 }
            });
            chain.push({ userId: u1._id, level: 1, amount: amount1 });

            // Level 2
            const level2Id = u1.referredBy;
            if (level2Id) {
                const u2 = await User.findById(level2Id);
                if (u2) {
                    const amount2 = Math.round((fullPrice * LEVEL2_PERCENT) / 100);
                    await Transaction.create({
                        type: "commission",
                        fromPurchaseId: purchase._id,
                        toUserId: u2._id,
                        amount: amount2,
                        level: 2,
                        description: `Level 2 commission ${LEVEL2_PERCENT}%`
                    });
                    await User.findByIdAndUpdate(u2._id, {
                        $inc: { earningsBalance: amount2, totalEarnings: amount2 }
                    });
                    chain.push({ userId: u2._id, level: 2, amount: amount2 });

                    // Level 3
                    const level3Id = u2.referredBy;
                    if (level3Id) {
                        const u3 = await User.findById(level3Id);
                        if (u3) {
                            const amount3 = Math.round((fullPrice * LEVEL3_PERCENT) / 100);
                            await Transaction.create({
                                type: "commission",
                                fromPurchaseId: purchase._id,
                                toUserId: u3._id,
                                amount: amount3,
                                level: 3,
                                description: `Level 3 commission ${LEVEL3_PERCENT}%`
                            });
                            await User.findByIdAndUpdate(u3._id, {
                                $inc: { earningsBalance: amount3, totalEarnings: amount3 }
                            });
                            chain.push({ userId: u3._id, level: 3, amount: amount3 });
                        }
                    }
                }
            }
        }
    }

    // Save refChain into purchase (for historical record) and mark completed
    purchase.refChain = chain;
    purchase.status = "completed";
    await purchase.save();
    return chain;
}

module.exports = {
    distributeCommissionsForPurchase
};
