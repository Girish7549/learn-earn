const Course = require("../models/Course");
const cloudinary = require("../config/cloudinary");

// ===============================
// List all active courses (Public)
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



// Utility for Cloudinary Upload
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "courses/image",
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

// ===============================
// Create course
// ===============================
exports.createCourse = async (req, res) => {
    try {
        const { title, description, price, category, duration, instructor } = req.body;
        const courseData = { title, description, price, category, duration, instructor };

        // 🔹 Handle course thumbnail upload
        if (req.files?.thumbnail?.length > 0) {
            const uploadedImage = await uploadBufferToCloudinary(
                req.files.thumbnail[0].buffer,
                req.files.thumbnail[0].originalname,
                "image"
            );
            courseData.thumbnail = uploadedImage;
        }

        // // 🔹 Handle course preview video (optional)
        // if (req.files?.previewVideo?.length > 0) {
        //     const uploadedVideo = await uploadBufferToCloudinary(
        //         req.files.previewVideo[0].buffer,
        //         req.files.previewVideo[0].originalname,
        //         "video"
        //     );
        //     courseData.previewVideo = uploadedVideo;
        // }

        const course = await Course.create(courseData);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    } catch (err) {
        console.error("Create Course Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// ===============================
// Update course (Admin only)
// ===============================
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });

        const updates = req.body;
        console.log("from ui : ", req.files?.thumbnail)

        // 🔹 Update thumbnail if uploaded
        if (req.files?.thumbnail?.length > 0) {
            const uploadedImage = await uploadBufferToCloudinary(
                req.files.thumbnail[0].buffer,
                req.files.thumbnail[0].originalname,
                "image"
            );
            updates.thumbnail = uploadedImage;
        }
        console.log("IMAGE URL ;", updates.thumbnail)

        // // 🔹 Update preview video if uploaded
        // if (req.files?.previewVideo?.length > 0) {
        //     const uploadedVideo = await uploadBufferToCloudinary(
        //         req.files.previewVideo[0].buffer,
        //         req.files.previewVideo[0].originalname,
        //         "video"
        //     );
        //     updates.previewVideo = uploadedVideo;
        // }

        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updates, {
            new: true,
        });

        res.json({
            success: true,
            message: "Course updated successfully",
            course: updatedCourse,
        });
    } catch (err) {
        console.error("Update Course Error:", err);
        res.status(500).json({ error: err.message });
    }
};


// ===============================
// Delete course (Admin only)
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
// Toggle active/inactive course (Admin only)
// ===============================
exports.toggleCourseStatus = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: "Course not found" });
        course.isActive = !course.isActive;
        await course.save();
        res.json({
            message: `Course ${course.isActive ? "activated" : "deactivated"} successfully`,
            course
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
