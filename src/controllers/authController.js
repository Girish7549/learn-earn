const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

function generateReferralCode() {
    return "R" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// 🟢 Register or Login (auto)
exports.registerOrLogin = async (req, res) => {
    try {
        const { email, role, name, referralCode, password } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        let user = await User.findOne({ email });

        // If user doesn't exist, create a new one
        if (!user) {
            const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

            user = new User({
                email,
                name: name || "",
                role,
                password: hashedPassword,
                referralCode: generateReferralCode(),
            });

            // Referral handling
            if (referralCode) {
                const referrer = await User.findOne({ referralCode });
                if (referrer) {
                    user.referredBy = referrer._id;
                    referrer.successfulReferrals += 1;
                    await referrer.save();
                }
            }

            await user.save();
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// 🟢 Regular Login (email + password)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "Email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", { expiresIn: "30d" });

        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

// 🟢 Get current user profile
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// Get All Users
exports.allUser = async (req, res) => {
    try {
        const users = await User.find().populate("referredBy").sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
}

// ===== Upload Buffer to Cloudinary (reusable helper) =====
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "users/image",
                use_filename: true,
                public_id: originalname.split(".")[0].trim(),
                unique_filename: false,
                resource_type: type === "audio" ? "video" : "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// 🟡 Update user (Admin use)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, gender, dob, address, bio, socialLinks, totalEarnings, earningsBalance } = req.body;

        const userId = req.params.id;

        // 🧩 Only admin OR same user can update
        if (req.user.role !== "admin" && req.user.id !== userId) {
            return res.status(403).json({ error: "Unauthorized to update this user" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 🔹 Basic Info
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;
        if (dob) user.dob = new Date(dob);
        if (bio) user.bio = bio;

        // 🔹 Parse address (string → object)
        let parsedAddress = {};
        if (address) {
            try {
                parsedAddress =
                    typeof address === "string" ? JSON.parse(address) : address;
            } catch (err) {
                parsedAddress = {};
            }
            user.address = { ...user.address, ...parsedAddress };
        }

        // 🔹 Parse socialLinks (string → object)
        let parsedSocial = {};
        if (socialLinks) {
            try {
                parsedSocial =
                    typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
            } catch (err) {
                parsedSocial = {};
            }
            user.socialLinks = { ...user.socialLinks, ...parsedSocial };
        }

        // 🔹 Admin can change role
        if (role && req.user.role === "admin") {
            user.role = role;
        }

        // 🔹 Password update
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // 🔹 Handle profile image upload
        if (req.files?.profileImage?.length > 0) {
            const uploadedImage = await uploadBufferToCloudinary(
                req.files.profileImage[0].buffer,
                req.files.profileImage[0].originalname,
                "image"
            );
            user.profileImage = uploadedImage;
        }

        await user.save();

        res.json({
            success: true,
            message: "User updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                gender: user.gender,
                dob: user.dob,
                address: user.address,
                profileImage: user.profileImage,
                bio: user.bio,
                socialLinks: user.socialLinks,
                totalEarnings,
                earningsBalance,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error("Update User Error:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};


// 🔴 Delete user (Admin use)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

