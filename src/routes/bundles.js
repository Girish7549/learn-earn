const express = require("express");
const router = express.Router();
const bundleController = require("../controllers/bundleController");

router.get("/", bundleController.listBundles);
router.post("/", bundleController.createBundle); // admin only ideally

module.exports = router;
