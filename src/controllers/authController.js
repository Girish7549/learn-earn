const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateReferralCode() {
    return "R" + crypto.randomBytes(4).toString("hex");
}

// NOTE: This is a simple email-register endpoint (no OTP). Adapt to OTP if you want.
exports.registerOrLogin = async (req, res) => {
    try {
        const { email, name, referralCode } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name: name || "",
                referralCode: generateReferralCode()
            });
            // Link referrer if provided and exists
            if (referralCode) {
                const ref = await User.findOne({ referralCode });
                if (ref) user.referredBy = ref._id;
            }
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.me = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ user });
};
