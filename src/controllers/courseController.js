const Course = require("../models/Course");
const cloudinary = require("../config/cloudinary");

// ===============================
// Utility for Cloudinary Upload (Buffer)
// ===============================
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: type === "image" ? "courses/thumbnails" : "courses/videos",
                use_filename: true,
                public_id: originalname.split(".")[0].trim(),
                unique_filename: false,
                resource_type: type === "video" ? "video" : "image",
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
// List all courses
// ===============================
exports.listCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Get single course by ID
// ===============================
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Create Course
// ===============================
exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, category, duration, instructor, sections } = req.body;

        // 🔹 Parse sections JSON string
        let parsedSections = [];
        try {
            parsedSections = JSON.parse(sections || "[]");
        } catch (err) {
            return res.status(400).json({ error: "Invalid sections JSON format" });
        }

        const courseData = { title, description, price, category, duration, instructor, sections: [] };

        // 🔹 Upload thumbnail if exists
        if (req.files?.thumbnail?.length > 0) {
            const uploadedImage = await uploadBufferToCloudinary(
                req.files.thumbnail[0].buffer,
                req.files.thumbnail[0].originalname,
                "image"
            );
            courseData.thumbnail = uploadedImage;
        }

        // 🔹 Add sections & lessons (videoUrl comes from frontend)
        parsedSections.forEach((section) => {
            const sectionData = { title: section.title, lessons: [] };
            section.lessons.forEach((lesson) => {
                sectionData.lessons.push({
                    title: lesson.title,
                    videoUrl: lesson.videoUrl || "", // URL sent from frontend
                    duration: lesson.duration || "",
                    isFreePreview: lesson.isFreePreview || false,
                });
            });
            courseData.sections.push(sectionData);
        });

        const course = await Course.create(courseData);

        res.status(201).json({
            success: true,
            message: "✅ Course created successfully with video URLs",
            course,
        });
    } catch (err) {
        console.error("❌ Create Course Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Update Course
// ===============================
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });

        const updates = { ...req.body };

        // 🔹 Upload new thumbnail if exists
        if (req.files?.thumbnail?.length > 0) {
            const uploadedImage = await uploadBufferToCloudinary(
                req.files.thumbnail[0].buffer,
                req.files.thumbnail[0].originalname,
                "image"
            );
            updates.thumbnail = uploadedImage;
        }

        // 🔹 Parse sections JSON if sent
        if (updates.sections) {
            try {
                updates.sections = JSON.parse(updates.sections);
            } catch (err) {
                return res.status(400).json({ error: "Invalid sections JSON format" });
            }
        }

        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updates, { new: true });

        res.json({
            success: true,
            message: "✅ Course updated successfully",
            course: updatedCourse,
        });
    } catch (err) {
        console.error("❌ Update Course Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Delete Course
// ===============================
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Toggle Active/Inactive
// ===============================
exports.toggleCourseStatus = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });
        course.isActive = !course.isActive;
        await course.save();
        res.json({
            message: `Course ${course.isActive ? "activated" : "deactivated"} successfully`,
            course,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
