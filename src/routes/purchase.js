const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdminMiddleware = require("../middlewares/isAdminMiddleware");

// User routes
router.post("/", authMiddleware, purchaseController.createPurchase);
router.post("/verify", authMiddleware, purchaseController.verifyPayment);
router.get("/my", authMiddleware, purchaseController.getMyPurchases);

// Admin routes
router.get("/admin/all", authMiddleware, isAdminMiddleware, purchaseController.getAllPurchases);
router.put("/admin/:id/status", authMiddleware, isAdminMiddleware, purchaseController.updatePurchaseStatus);

module.exports = router;
