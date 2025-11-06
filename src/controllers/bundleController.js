const Bundle = require("../models/Bundle");
const Purchase = require("../models/Purchase");

// ===============================
// 📦 Get All Active Bundles (Public)
// ===============================
exports.listBundles = async (req, res) => {
    try {
        const bundles = await Bundle.find()
            .populate("courseIds")
            .sort({ createdAt: -1 });
        res.json({ success: true, bundles });
    } catch (err) {
        console.error("Error fetching bundles:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
// ===============================
// 📦 Get All User Bundles (Public)
// ===============================
exports.userBundles = async (req, res) => {
    try {
        const userId = req.user?._id;

        // 1️⃣ Get all active bundles with full course details
        const bundles = await Bundle.find({ isActive: true })
            .populate({
                path: "courseIds",
                model: "Course",
                select: "title description thumbnail sections createdAt",
            })
            .sort({ createdAt: -1 });

        // 2️⃣ Find purchases made by this user
        const purchases = await Purchase.find({ userId, status: "completed" })
            .select("bundleId purchasedBundles")
            .populate({
                path: "bundleId purchasedBundles",
                model: "Bundle",
                select: "name thumbnail price description",
            });

        // 3️⃣ Extract all purchased bundle IDs
        const purchasedIds = new Set();

        purchases.forEach((p) => {
            if (p.bundleId?._id) purchasedIds.add(p.bundleId._id.toString());
            (p.purchasedBundles || []).forEach((b) =>
                purchasedIds.add(b.toString())
            );
        });

        // 4️⃣ Separate purchased vs available bundles
        const purchasedBundles = bundles.filter((b) =>
            purchasedIds.has(b._id.toString())
        );
        const availableBundles = bundles.filter(
            (b) => !purchasedIds.has(b._id.toString())
        );

        // ✅ Final response
        res.status(200).json({
            success: true,
            user: userId,
            purchasedCount: purchasedBundles.length,
            availableCount: availableBundles.length,
            purchasedBundles,
            availableBundles,
        });
    } catch (error) {
        console.error("Error in userBundles:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bundles",
            error: error.message,
        });
    }
};

// ===============================
// 📦 Get Single Bundle by ID (Public)
// ===============================
exports.getBundleById = async (req, res) => {
    try {
        const bundle = await Bundle.findById(req.params.id).populate("courseIds");
        if (!bundle) {
            return res.status(404).json({ success: false, message: "Bundle not found" });
        }
        res.json({ success: true, bundle });
    } catch (err) {
        console.error("Error fetching bundle:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// 🛠️ Create New Bundle (Admin)
// ===============================
exports.createBundle = async (req, res) => {
    try {
        const { name, price, description, courseIds, thumbnail, isActive } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: "Name and price are required" });
        }

        const newBundle = await Bundle.create({
            name,
            price,
            description,
            courseIds,
            thumbnail,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({ success: true, bundle: newBundle });
    } catch (err) {
        console.error("Error creating bundle:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// ✏️ Update Bundle by ID (Admin)
// ===============================
exports.updateBundle = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBundle = await Bundle.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBundle) {
            return res.status(404).json({ success: false, message: "Bundle not found" });
        }
        res.json({ success: true, bundle: updatedBundle });
    } catch (err) {
        console.error("Error updating bundle:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// ❌ Delete Bundle by ID (Admin)
// ===============================
exports.deleteBundle = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Bundle.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Bundle not found" });
        }
        res.json({ success: true, message: "Bundle deleted successfully" });
    } catch (err) {
        console.error("Error deleting bundle:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// 🧩 Toggle Active/Inactive Status (Admin)
// ===============================
exports.toggleBundleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const bundle = await Bundle.findById(id);
        if (!bundle) {
            return res.status(404).json({ success: false, message: "Bundle not found" });
        }
        bundle.isActive = !bundle.isActive;
        await bundle.save();
        res.json({
            success: true,
            message: `Bundle ${bundle.isActive ? "activated" : "deactivated"} successfully`,
            bundle
        });
    } catch (err) {
        console.error("Error toggling bundle status:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
