const Course = require("../models/Course");

exports.listCourses = async (req, res) => {
    const courses = await Course.find({ isActive: true });
    res.json(courses);
};

exports.createCourse = async (req, res) => {
    // admin only - simplified
    const course = await Course.create(req.body);
    res.json(course);
};
