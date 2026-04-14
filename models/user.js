const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    phoneVerified: {
        type: Boolean,
        default: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatarUrl: {
        type: String,
        trim: true,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    authMethods: [{
        type: String,
        enum: ["local", "google", "phone"],
    }],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
});

userSchema.pre("save", function normalizeAuthMethods() {
    if (Array.isArray(this.authMethods)) {
        this.authMethods = [...new Set(this.authMethods)];
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
