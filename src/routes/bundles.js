const express = require("express");
const router = express.Router();
const bundleController = require("../controllers/bundleController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdminMiddleware = require("../middlewares/isAdminMiddleware");
const upload = require("../config/multer");


// Public routes
router.get("/", bundleController.listBundles);
router.get("/user", authMiddleware, bundleController.userBundles);
router.get("/:id", authMiddleware, bundleController.getBundleById);

// Admin routes (add JWT + admin middleware later)
router.post("/", authMiddleware, isAdminMiddleware, upload.fields([{ name: "thumbnail", maxCount: 1 }]), bundleController.createBundle)
router.put("/:id", authMiddleware, isAdminMiddleware, upload.fields([{ name: "thumbnail", maxCount: 1 }]), bundleController.updateBundle)
// router.post("/", authMiddleware, isAdminMiddleware, bundleController.createBundle);
// router.put("/:id", authMiddleware, isAdminMiddleware, bundleController.updateBundle);
router.delete("/:id", authMiddleware, isAdminMiddleware, bundleController.deleteBundle);
router.patch("/:id/toggle", authMiddleware, isAdminMiddleware, bundleController.toggleBundleStatus);

module.exports = router;
