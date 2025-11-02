const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Raw body middleware applied in server.js only to this path
router.post("/razorpay", webhookController.razorpayWebhook);

module.exports = router;
