const Purchase = require("../models/Purchase");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const Bundle = require("../models/Bundle");
const mongoose = require("mongoose");

// ==============================
// Get My Dashboard (User View)
// ==============================
exports.getMyDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        const purchases = await Purchase.find({ userId }).populate("bundleId");
        const transactions = await Transaction.find({ toUserId: userId }).sort({ createdAt: -1 });

        res.json({
            user,
            purchases,
            transactions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id; // assuming verified via auth middleware

        // 🧩 Fetch the user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 🧮 Total Earnings, Available (Earnings Balance), Withdrawn
        const totalEarnings = user.totalEarnings || 0;
        const availableBalance = user.earningsBalance || 0;

        // You might store withdrawals in a separate model, but here we’ll assume:
        const withdrawn = totalEarnings - availableBalance;

        // 🗓️ Today’s & Weekly Earnings (based on Purchase date and referral chain)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        // Find purchases where this user got commission today
        const todaysEarningsAgg = await Purchase.aggregate([
            { $unwind: "$refChain" },
            { $match: { "refChain.userId": new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: "$refChain.amount" } } }
        ]);

        const weeklyEarningsAgg = await Purchase.aggregate([
            { $unwind: "$refChain" },
            { $match: { "refChain.userId": new mongoose.Types.ObjectId(userId), createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, total: { $sum: "$refChain.amount" } } }
        ]);

        const todaysEarnings = todaysEarningsAgg[0]?.total || 0;
        const weeklyEarnings = weeklyEarningsAgg[0]?.total || 0;

        // 👥 Active Referrals
        const activeReferrals = await User.countDocuments({ referredBy: userId });

        // 🎓 Purchased Courses / Bundle
        const purchases = await Purchase.find({ userId, status: "completed" }).populate("bundleId");
        const enrolledBundles = purchases.map(p => p.bundleId?.name).filter(Boolean);

        // 🏆 Leaderboard (Top 10 users by totalEarnings)
        const leaderboard = await User.find({}, "name totalEarnings profileImage successfulReferrals")
            .sort({ totalEarnings: -1 });
        // .limit(10);

        const rank = leaderboard.filter((lead) => lead.name === user.name)

        const leaderboardData = leaderboard.map((u, index) => ({
            rank: index + 1,
            name: u.name,
            image: u.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            referrals: u.successfulReferrals,
            earnings: `₹${u.totalEarnings.toLocaleString()}`
        }));

        // ✅ Response
        res.json({
            success: true,
            data: {
                user: {
                    name: user.name,
                    totalEarnings,
                    todaysEarnings,
                    weeklyEarnings,
                    withdrawn,
                    availableBalance,
                    activeReferrals,
                    enrolledBundles,
                },
                leaderboard: leaderboardData,
            },
        });
        // res.json({
        //     success: true,
        //     data: {
        //         user: {
        //             name: user.name,
        //             totalEarnings: 850430,
        //             todaysEarnings: 3625,
        //             weeklyEarnings: 12400,
        //             withdrawn: 780480,
        //             availableBalance: 69950,
        //             activeReferrals,
        //             enrolledBundles,
        //         },
        //         leaderboard: leaderboardData,
        //     },
        // });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};


// ==============================
// Get My Purchases
// ==============================
exports.getMyPurchases = async (req, res) => {
    try {
        const userId = req.user.id;
        const purchases = await Purchase.find({ userId }).populate("bundleId");
        res.json(purchases);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==============================
// Get My Transactions
// ==============================
exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({ toUserId: userId }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==============================
// Get My Referral Summary
// ==============================
exports.getMyReferrals = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        const referredUsers = await User.find({ referredBy: userId });
        const totalReferrals = referredUsers.length;
        const totalEarnings = user.earningsBalance;

        res.json({
            totalReferrals,
            totalEarnings,
            referredUsers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

// ==============================
// Admin Dashboard (Summary View)
// ==============================
exports.adminDashboard = async (req, res) => {
    try {
        const users = await User.countDocuments();
        const totalEarnings = await User.aggregate([{ $group: { _id: null, total: { $sum: "$totalEarnings" } } }]);
        const totalPurchases = await Purchase.countDocuments();

        res.json({
            users,
            totalPurchases,
            totalEarnings: totalEarnings[0]?.total || 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};
