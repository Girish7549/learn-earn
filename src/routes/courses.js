const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdminMiddleware = require("../middlewares/isAdminMiddleware");
const upload = require("../config/multer");


// Public (auth only)
router.get("/", authMiddleware, courseController.listCourses);
router.get("/:id", authMiddleware, courseController.getCourseById);

// Admin only
router.post("/", authMiddleware, isAdminMiddleware, upload.fields([{ name: "thumbnail", maxCount: 1 }]), courseController.createCourse)
router.put("/:id", authMiddleware, isAdminMiddleware, upload.fields([{ name: "thumbnail", maxCount: 1 }]), courseController.updateCourse)
// router.post("/", authMiddleware, isAdminMiddleware, courseController.createCourse);
// router.put("/:id", authMiddleware, isAdminMiddleware, courseController.updateCourse);
router.delete("/:id", authMiddleware, isAdminMiddleware, courseController.deleteCourse);
router.patch("/:id/toggle", authMiddleware, isAdminMiddleware, courseController.toggleCourseStatus);

module.exports = router;
