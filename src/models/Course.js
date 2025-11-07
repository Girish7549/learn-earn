// models/Course.js
const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, default: "" },
    duration: { type: String },
    isFreePreview: { type: Boolean, default: false },
});

const SectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    lessons: [LessonSchema],
});

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number },
    category: { type: String },
    duration: { type: String },
    instructor: { type: String },
    sections: [SectionSchema],
    thumbnail: { type: String },
    isActive: { type: Boolean, default: true },
    previewVideo: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", CourseSchema);
