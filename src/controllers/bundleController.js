const Bundle = require("../models/Bundle");
const Purchase = require("../models/Purchase");
const cloudinary = require("../config/cloudinary");

// ===============================
// Utility: Upload Buffer to Cloudinary
// ===============================
const uploadBufferToCloudinary = (buffer, originalname, folder = "bundles") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                use_filename: true,
                public_id: originalname.split(".")[0].trim(),
                unique_filename: false,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// ===============================
// List all bundles (public)
// ===============================
exports.listBundles = async (req, res) => {
    try {
        const bundles = await Bundle.find()
            .populate("courseIds", "title thumbnail")
            .sort({ createdAt: -1 });
        res.json({ success: true, bundles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// Get bundles for logged-in user
// ===============================
exports.userBundles = async (req, res) => {
    try {
        const userId = req.user?._id;

        const bundles = await Bundle.find({ isActive: true })
            .populate("courseIds", "title description thumbnail sections")
            .sort({ createdAt: -1 });

        const purchases = await Purchase.find({ userId, status: "completed" })
            .select("bundleId purchasedBundles")
            .populate({
                path: "bundleId purchasedBundles",
                model: "Bundle",
                select: "name thumbnail price description",
            });

        const purchasedIds = new Set();
        purchases.forEach((p) => {
            if (p.bundleId?._id) purchasedIds.add(p.bundleId._id.toString());
            (p.purchasedBundles || []).forEach((b) => purchasedIds.add(b.toString()));
        });

        const purchasedBundles = bundles.filter((b) => purchasedIds.has(b._id.toString()));
        const availableBundles = bundles.filter((b) => !purchasedIds.has(b._id.toString()));

        res.json({
            success: true,
            user: userId,
            purchasedCount: purchasedBundles.length,
            availableCount: availableBundles.length,
            purchasedBundles,
            availableBundles,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch bundles" });
    }
};

// ===============================
// Get single bundle by ID
// ===============================
exports.getBundleById = async (req, res) => {
    try {
        const bundle = await Bundle.findById(req.params.id).populate("courseIds");
        if (!bundle) return res.status(404).json({ success: false, message: "Bundle not found" });
        res.json({ success: true, bundle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// Create Bundle (Admin)
// ===============================
exports.createBundle = async (req, res) => {
    try {
        const { name, price, description, courseIds, isActive } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: "Name and price are required" });
        }

        let thumbnailUrl = null;
        if (req.files?.thumbnail?.length > 0) {
            thumbnailUrl = await uploadBufferToCloudinary(req.files.thumbnail[0].buffer, req.files.thumbnail[0].originalname);
        }

        const newBundle = await Bundle.create({
            name,
            price,
            description,
            courseIds: courseIds ? JSON.parse(courseIds) : [],
            thumbnail: thumbnailUrl,
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({ success: true, bundle: newBundle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// Update Bundle (Admin)
// ===============================
exports.updateBundle = async (req, res) => {
    try {
        const { id } = req.params;

        const updates = { ...req.body };

        // Handle JSON parsing for courseIds
        if (updates.courseIds) {
            updates.courseIds = JSON.parse(updates.courseIds);
        }

        // Handle thumbnail upload
        if (req.files?.thumbnail?.length > 0) {
            updates.thumbnail = await uploadBufferToCloudinary(
                req.files.thumbnail[0].buffer,
                req.files.thumbnail[0].originalname
            );
        }

        const updatedBundle = await Bundle.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBundle) return res.status(404).json({ success: false, message: "Bundle not found" });

        res.json({ success: true, bundle: updatedBundle });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// Delete Bundle
// ===============================
exports.deleteBundle = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Bundle.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: "Bundle not found" });
        res.json({ success: true, message: "Bundle deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ===============================
// Toggle Active/Inactive (Admin)
// ===============================
exports.toggleBundleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const bundle = await Bundle.findById(id);
        if (!bundle) return res.status(404).json({ success: false, message: "Bundle not found" });

        bundle.isActive = !bundle.isActive;
        await bundle.save();

        res.json({
            success: true,
            message: `Bundle ${bundle.isActive ? "activated" : "deactivated"} successfully`,
            bundle
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
