const mongoose = require("mongoose");

// const ProfileSchema = new mongoose.Schema({
//     phone: { type: String },
//     gender: { type: String, enum: ["male", "female", "other"] },
//     dob: { type: Date },
//     address: {
//         street: String,
//         city: String,
//         state: String,
//         country: String,
//         pincode: String,
//     },
//     profileImage: { type: String },
//     bio: { type: String, maxlength: 300 },
//     socialLinks: {
//         instagram: String,
//         linkedin: String,
//         youtube: String,
//         twitter: String,
//     },
// });

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    referralCode: {
        type: String,
        unique: true,
    },
    tokenBalance: {
        type: Number,
        default: 0,
    },
    earningsBalance: {
        type: Number,
        default: 0,
    },
    totalEarnings: {
        type: Number,
        default: 0,
    },
    successfulReferrals: {
        type: Number,
        default: 0,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    phone: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
    },
    profileImage: { type: String },
    bio: { type: String, maxlength: 300 },
    socialLinks: {
        instagram: String,
        linkedin: String,
        youtube: String,
        twitter: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", UserSchema);
