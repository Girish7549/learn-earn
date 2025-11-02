const Purchase = require("../models/Purchase");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.getMyDashboard = async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const purchases = await Purchase.find({ userId }).populate("bundleId");
    const transactions = await Transaction.find({ toUserId: userId }).sort({ createdAt: -1 });
    res.json({
        user,
        purchases,
        transactions
    });
};
