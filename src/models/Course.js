const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
    title: String,
    videoUrl: String,
    duration: String,
    isFreePreview: {
        type: Boolean,
        default: false
    }
});

const SectionSchema = new mongoose.Schema({
    title: String,
    lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
    title: String,
    description: String,
    sections: [SectionSchema],
    thumbnail: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Course", CourseSchema);
