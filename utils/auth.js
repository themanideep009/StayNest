const crypto = require("crypto");

const User = require("../models/user.js");

function isGoogleAuthConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function isPhoneAuthConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_VERIFY_SERVICE_SID
    );
}

function canUseDevPhoneAuth() {
    return (process.env.NODE_ENV || "development") !== "production";
}

function normalizePhoneNumber(value = "") {
    const raw = String(value).trim();
    if (!raw) {
        return null;
    }

    let digits = raw.replace(/\D/g, "");

    if (raw.startsWith("+")) {
        const internationalNumber = `+${digits}`;
        return /^\+[1-9]\d{7,14}$/.test(internationalNumber) ? internationalNumber : null;
    }

    if (digits.length === 10) {
        return `+91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("91")) {
        return `+${digits}`;
    }

    if (digits.length >= 8 && digits.length <= 15) {
        return `+${digits}`;
    }

    return null;
}

function hashOtpCode(code) {
    const secret = process.env.SESSION_SECRET || "dev-only-change-me";
    return crypto.createHash("sha256").update(`${code}:${secret}`).digest("hex");
}

function createOtpCode() {
    return String(crypto.randomInt(100000, 1000000));
}

async function buildUniqueUsername(seed = "traveler") {
    const baseSeed = String(seed).toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = (baseSeed || "traveler").slice(0, 20);

    for (let attempt = 0; attempt < 20; attempt += 1) {
        const suffix = attempt === 0 ? "" : String(crypto.randomInt(10, 9999));
        const candidate = `${base}${suffix}`.slice(0, 30);

        if (candidate.length < 3) {
            continue;
        }

        const existingUser = await User.findOne({ username: candidate });
        if (!existingUser) {
            return candidate;
        }
    }

    return `traveler${Date.now()}`.slice(0, 30);
}

async function findOrCreateGoogleUser(profile) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
        throw new Error("Google account did not provide an email address.");
    }

    let user = await User.findOne({
        $or: [{ googleId }, { email }],
    });

    if (!user) {
        const usernameSeed = profile.displayName || email.split("@")[0];
        const username = await buildUniqueUsername(usernameSeed);

        user = new User({
            username,
            email,
            googleId,
            avatarUrl: profile.photos?.[0]?.value,
            authMethods: ["google"],
        });

        await user.save();
        return user;
    }

    if (!user.googleId) {
        user.googleId = googleId;
    }

    if (!user.email) {
        user.email = email;
    }

    if (profile.photos?.[0]?.value && !user.avatarUrl) {
        user.avatarUrl = profile.photos[0].value;
    }

    user.authMethods = [...new Set([...(user.authMethods || []), "google"])];
    await user.save();
    return user;
}

module.exports = {
    buildUniqueUsername,
    canUseDevPhoneAuth,
    createOtpCode,
    findOrCreateGoogleUser,
    hashOtpCode,
    isGoogleAuthConfigured,
    isPhoneAuthConfigured,
    normalizePhoneNumber,
};
