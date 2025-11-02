const Bundle = require("../models/Bundle");

exports.listBundles = async (req, res) => {
    const bundles = await Bundle.find({ isActive: true }).populate("courseIds");
    res.json(bundles);
};

exports.createBundle = async (req, res) => {
    // admin only - simplified
    const b = await Bundle.create(req.body);
    res.json(b);
};
