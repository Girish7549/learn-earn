const mongoose = require("mongoose");

const BundleSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    thumbnail: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bundle", BundleSchema);
