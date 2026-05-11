const express = require("express");
const passport = require("passport");
const twilio = require("twilio");
const crypto = require("crypto");

const User = require("../models/user.js");
const { saveRedirectUrl, validatePhoneAuthStart, validateUser } = require("../utils/middleware.js");
const { isEmailConfigured, sendPasswordResetEmail } = require("../utils/mailer.js");
const {
    buildUniqueUsername,
    canUseDevPhoneAuth,
    createOtpCode,
    hashOtpCode,
    isGoogleAuthConfigured,
    isPhoneAuthConfigured,
    normalizePhoneNumber,
} = require("../utils/auth.js");

const router = express.Router();

function getPendingPhoneAuth(req, purpose) {
    const pendingPhoneAuth = req.session.pendingPhoneAuth;
    if (!pendingPhoneAuth || pendingPhoneAuth.purpose !== purpose) {
        return null;
    }

    if (Date.now() > pendingPhoneAuth.expiresAt) {
        delete req.session.pendingPhoneAuth;
        return null;
    }

    return pendingPhoneAuth;
}

function renderAuthPage(req, res, authMode) {
    const mode = authMode === "signup" ? "signup" : "login";
    res.render("users/auth.ejs", {
        authMode: mode,
        pendingPhoneAuth: getPendingPhoneAuth(req, mode),
    });
}

function hashResetToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function hasLocalPassword(user) {
    return Boolean(
        (user.authMethods || []).includes("local") ||
        (user.hash && user.salt)
    );
}

async function findUserByPhone(phoneNumber) {
    return User.findOne({ phoneNumber });
}

async function sendPhoneCode(req, { phoneNumber, purpose, username, email }) {
    const baseState = {
        purpose,
        phoneNumber,
        username: username || "",
        email: email || "",
        attempts: 0,
        expiresAt: Date.now() + 10 * 60 * 1000,
    };

    if (isPhoneAuthConfigured()) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: "sms" });

        req.session.pendingPhoneAuth = {
            ...baseState,
            provider: "twilio",
        };
        return;
    }

    if (!canUseDevPhoneAuth()) {
        throw new Error("Phone authentication is not configured for this environment.");
    }

    const code = createOtpCode();
    req.session.pendingPhoneAuth = {
        ...baseState,
        provider: "dev",
        codeHash: hashOtpCode(code),
    };

    console.log(`Development phone OTP for ${phoneNumber}: ${code}`);
    req.flash("success", `Development OTP for ${phoneNumber}: ${code}`);
}

async function verifyPhoneCode(req, pendingPhoneAuth, code) {
    if (pendingPhoneAuth.provider === "twilio") {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({
                to: pendingPhoneAuth.phoneNumber,
                code,
            });

        return verificationCheck.status === "approved";
    }

    return hashOtpCode(code) === pendingPhoneAuth.codeHash;
}

async function loginAndRedirect(req, res, next, user, successMessage) {
    req.login(user, (err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", successMessage);
        const redirectUrl = req.session.redirectUrl || "/listings";
        delete req.session.redirectUrl;
        return res.redirect(redirectUrl);
    });
}

async function createPhoneSignupUser(pendingPhoneAuth) {
    const username = pendingPhoneAuth.username || await buildUniqueUsername(pendingPhoneAuth.phoneNumber.slice(-6));
    const email = pendingPhoneAuth.email || undefined;

    const user = new User({
        username,
        email,
        phoneNumber: pendingPhoneAuth.phoneNumber,
        phoneVerified: true,
        authMethods: ["phone"],
    });

    await user.save();
    return user;
}

// Signup
router.get("/auth", (req, res) => {
    renderAuthPage(req, res, req.query.mode);
});

router.get("/signup", (req, res) => {
    res.redirect("/auth?mode=signup");
});

router.post("/signup", validateUser, async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        username = username.trim();
        email = email.trim().toLowerCase();

        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            req.flash("error", "An account with that email already exists.");
            return res.redirect("/auth?mode=signup");
        }

        const newUser = new User({ email, username, authMethods: ["local"] });
        const registeredUser = await User.register(newUser, password);
        return loginAndRedirect(req, res, next, registeredUser, "Welcome to Stayhub!");
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect("/auth?mode=signup");
    }
});

// Login
router.get("/login", (req, res) => {
    res.redirect("/auth?mode=login");
});

router.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/auth?mode=login",
        failureFlash: true,
    }),
    async (req, res) => {
        if (!(req.user.authMethods || []).includes("local")) {
            req.user.authMethods = [...new Set([...(req.user.authMethods || []), "local"])];
            await req.user.save();
        }
        req.flash("success", "Welcome back to Stayhub!");
        const redirectUrl = res.locals.redirectUrl || "/listings";
        res.redirect(redirectUrl);
    }
);

router.get("/forgot-password", (req, res) => {
    const pendingResetEmail = req.session.pendingResetEmail || "";
    const resetStage = req.session.resetPasswordUserId ? "reset" : (pendingResetEmail ? "verify" : "request");
    res.render("users/forgot-password.ejs", { pendingResetEmail, resetStage });
});

router.post("/forgot-password", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
        req.flash("error", "Please enter your email address.");
        return res.redirect("/forgot-password");
    }

    const user = await User.findOne({ email });

    if (!user || !hasLocalPassword(user)) {
        req.flash("success", "If that account supports password reset, a verification code has been sent.");
        return res.redirect("/forgot-password");
    }

    const resetCode = createOtpCode();
    user.resetPasswordToken = hashResetToken(resetCode);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    req.session.pendingResetEmail = email;

    if (isEmailConfigured()) {
        await sendPasswordResetEmail({ to: email, code: resetCode });
        req.flash("success", "A verification code has been sent to your email.");
    } else {
        req.flash("success", `Email is not configured yet. Your verification code is: ${resetCode}`);
        console.log(`Password reset code for ${email}: ${resetCode}`);
    }

    return res.redirect("/forgot-password");
});

router.post("/forgot-password/verify", async (req, res) => {
    const email = String(req.body.email || req.session.pendingResetEmail || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
        req.flash("error", "Enter your email and the 6-digit verification code.");
        return res.redirect("/forgot-password");
    }

    const hashedToken = hashResetToken(code);
    const user = await User.findOne({
        email,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
        req.flash("error", "That verification code is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    req.session.resetPasswordUserId = String(user._id);
    delete req.session.pendingResetEmail;
    req.flash("success", "Code verified. You can now set a new password.");
    return res.redirect("/forgot-password");
});

router.get("/forgot-password/verify", (req, res) => {
    req.flash("error", "Please enter the verification code from your email on the forgot password page.");
    return res.redirect("/forgot-password");
});

router.get("/reset-password", async (req, res) => {
    if (!req.session.resetPasswordUserId) {
        req.flash("error", "Verify your reset code first.");
        return res.redirect("/forgot-password");
    }

    return res.redirect("/forgot-password");
});

router.post("/reset-password", async (req, res) => {
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (password.length < 6) {
        req.flash("error", "Password must be at least 6 characters long.");
        return res.redirect("/reset-password");
    }

    if (password !== confirmPassword) {
        req.flash("error", "Password and confirm password must match.");
        return res.redirect("/reset-password");
    }

    if (!req.session.resetPasswordUserId) {
        req.flash("error", "Verify your reset code first.");
        return res.redirect("/forgot-password");
    }

    const user = await User.findById(req.session.resetPasswordUserId);

    if (!user) {
        delete req.session.resetPasswordUserId;
        req.flash("error", "That password reset session is no longer valid.");
        return res.redirect("/forgot-password");
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.authMethods = [...new Set([...(user.authMethods || []), "local"])];
    await user.save();

    delete req.session.resetPasswordUserId;
    req.flash("success", "Your password has been reset. Please log in.");
    return res.redirect("/auth?mode=login");
});

router.get("/reset-password/:token", (req, res) => {
    req.flash("error", "This reset link is no longer used. Please request a fresh verification code.");
    return res.redirect("/forgot-password");
});

router.get("/auth/google", (req, res, next) => {
    if (!isGoogleAuthConfigured()) {
        req.flash("error", "Google sign-in is not configured yet.");
        return res.redirect("/auth?mode=login");
    }

    return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get(
    "/auth/google/callback",
    (req, res, next) => {
        if (!isGoogleAuthConfigured()) {
            req.flash("error", "Google sign-in is not configured yet.");
            return res.redirect("/auth?mode=login");
        }

        return passport.authenticate("google", {
            failureRedirect: "/auth?mode=login",
            failureFlash: true,
        })(req, res, next);
    },
    (req, res) => {
        req.flash("success", "Signed in with Google successfully.");
        const redirectUrl = req.session.redirectUrl || "/listings";
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    }
);

router.post("/auth/phone/start", validatePhoneAuthStart, async (req, res) => {
    const purpose = req.body.purpose === "signup" ? "signup" : "login";
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phoneNumber = normalizePhoneNumber(String(req.body.phoneNumber || ""));
    const redirectTo = purpose === "signup" ? "/auth?mode=signup" : "/auth?mode=login";

    if (!phoneNumber) {
        req.flash("error", "Enter a valid phone number like 9876543210, 919876543210, or +919876543210.");
        return res.redirect(redirectTo);
    }

    try {
        const existingPhoneUser = await findUserByPhone(phoneNumber);

        if (purpose === "signup") {
            if (existingPhoneUser) {
                req.flash("error", "That phone number is already linked to an account.");
                return res.redirect("/auth?mode=login");
            }

            if (email) {
                const existingEmailUser = await User.findOne({ email });
                if (existingEmailUser) {
                    req.flash("error", "That email is already in use. Please log in instead.");
                    return res.redirect("/auth?mode=login");
                }
            }
        } else if (!existingPhoneUser) {
            req.flash("error", "No account was found for that phone number. Please sign up first.");
            return res.redirect("/auth?mode=signup");
        }

        await sendPhoneCode(req, { phoneNumber, purpose, username, email });
        req.flash("success", "We sent a verification code to your phone.");
        return res.redirect(redirectTo);
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect(redirectTo);
    }
});

router.post("/auth/phone/verify", async (req, res, next) => {
    const purpose = req.body.purpose === "signup" ? "signup" : "login";
    const redirectTo = purpose === "signup" ? "/auth?mode=signup" : "/auth?mode=login";
    const pendingPhoneAuth = getPendingPhoneAuth(req, purpose);
    const submittedPhoneNumber = normalizePhoneNumber(String(req.body.phoneNumber || ""));
    const code = String(req.body.code || "").trim();

    if (!pendingPhoneAuth) {
        req.flash("error", "Your verification session expired. Please request a new code.");
        return res.redirect(redirectTo);
    }

    if (submittedPhoneNumber !== pendingPhoneAuth.phoneNumber) {
        req.flash("error", "Phone number mismatch. Please retry the verification flow.");
        return res.redirect(redirectTo);
    }

    if (!/^\d{6}$/.test(code)) {
        req.flash("error", "Enter the 6-digit verification code.");
        return res.redirect(redirectTo);
    }

    if (pendingPhoneAuth.attempts >= 5) {
        delete req.session.pendingPhoneAuth;
        req.flash("error", "Too many attempts. Please request a new verification code.");
        return res.redirect(redirectTo);
    }

    try {
        pendingPhoneAuth.attempts += 1;
        const isValid = await verifyPhoneCode(req, pendingPhoneAuth, code);

        if (!isValid) {
            req.flash("error", "Invalid verification code. Please try again.");
            return res.redirect(redirectTo);
        }

        let user;

        if (purpose === "signup") {
            user = await createPhoneSignupUser(pendingPhoneAuth);
        } else {
            user = await findUserByPhone(pendingPhoneAuth.phoneNumber);
            if (!user) {
                delete req.session.pendingPhoneAuth;
                req.flash("error", "We could not find that phone account anymore. Please try again.");
                return res.redirect("/auth?mode=login");
            }
            user.phoneVerified = true;
            user.authMethods = [...new Set([...(user.authMethods || []), "phone"])];
            await user.save();
        }

        delete req.session.pendingPhoneAuth;
        return loginAndRedirect(
            req,
            res,
            next,
            user,
            purpose === "signup"
                ? "Your phone number is verified and your account is ready."
                : "Welcome back to Stayhub!"
        );
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect(redirectTo);
    }
});

// Logout
router.get("/logout", (req, res, next) => {
    delete req.session.pendingPhoneAuth;
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You've been logged out. See you soon!");
        res.redirect("/listings");
    });
});

module.exports = router;
