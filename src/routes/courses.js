const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

router.get("/", courseController.listCourses);
router.post("/", courseController.createCourse); // admin only in real app

module.exports = router;
