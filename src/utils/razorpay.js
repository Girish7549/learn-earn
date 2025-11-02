const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

function createOrder(amountInINR, receipt) {
    // amountInINR is an integer like 2499
    const options = {
        amount: amountInINR * 100, // paise
        currency: "INR",
        receipt: receipt,
        payment_capture: 1
    };
    return razorpay.orders.create(options);
}

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
    // Razorpay webhook signature is HMAC SHA256 of body using webhook secret
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signatureHeader;
}

module.exports = {
    razorpay,
    createOrder,
    verifyWebhookSignature
};
