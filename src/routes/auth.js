const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdminMiddleware = require("../middlewares/isAdminMiddleware");
const upload = require("../config/multer");


// Public Routes
router.post("/register", authController.registerOrLogin);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);
router.put("/user/:id", upload.fields([{ name: "profileImage", maxCount: 1 }]), authMiddleware, authController.updateUser);
// router.put("/user/:id", authMiddleware, authController.updateUser);

// router.put("/user/:id", authController.updateUser);

// Admin routes (add JWT + admin middleware later)

router.get("/users", authMiddleware, isAdminMiddleware, authController.allUser);
router.delete("/user/:id", authMiddleware, isAdminMiddleware, authController.deleteUser);


module.exports = router;
