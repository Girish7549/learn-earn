const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/me", authMiddleware, dashboardController.getMyDashboard);

module.exports = router;
