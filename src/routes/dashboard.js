const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdminMiddleware = require("../middlewares/isAdminMiddleware");

// User Dashboard
// router.get("/me", authMiddleware, dashboardController.getMyDashboard);
router.get("/me", authMiddleware, dashboardController.getDashboardStats);
router.get("/me/purchases", authMiddleware, dashboardController.getMyPurchases);
router.get("/me/transactions", authMiddleware, dashboardController.getMyTransactions);
router.get("/me/referrals", authMiddleware, dashboardController.getMyReferrals);

// Admin Dashboard
router.get("/admin/summary", authMiddleware, isAdminMiddleware, dashboardController.adminDashboard);

module.exports = router;
