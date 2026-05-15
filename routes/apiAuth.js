const express = require("express");

const User = require("../models/user.js");
const { userSchema } = require("../schema.js");
const {
    authenticateJwt,
    authorizeRoles,
    createJwtToken,
    toAuthUser,
} = require("../utils/jwt.js");

const router = express.Router();

function validateApiUser(req, res, next) {
    const payload = {
        user: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        },
    };
    const { error } = userSchema.validate(payload);

    if (error) {
        return res.status(400).json({
            error: error.details.map((detail) => detail.message).join(","),
        });
    }

    return next();
}

router.post("/signup", validateApiUser, async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        username = username.trim();
        email = email.trim().toLowerCase();

        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
            return res.status(409).json({ error: "An account with that email already exists." });
        }

        const newUser = new User({ email, username, authMethods: ["local"] });
        const user = await User.register(newUser, password);
        const token = createJwtToken(user);

        return res.status(201).json({
            token,
            tokenType: "Bearer",
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
            user: toAuthUser(user),
        });
    } catch (err) {
        return next(err);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const authenticate = User.authenticate();
        authenticate(username, password, async (err, user, options) => {
            try {
                if (err) {
                    return next(err);
                }

                if (!user) {
                    return res.status(401).json({
                        error: options?.message || "Invalid username or password.",
                    });
                }

                if (!(user.authMethods || []).includes("local")) {
                    user.authMethods = [...new Set([...(user.authMethods || []), "local"])];
                    await user.save();
                }

                const token = createJwtToken(user);
                return res.json({
                    token,
                    tokenType: "Bearer",
                    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
                    user: toAuthUser(user),
                });
            } catch (error) {
                return next(error);
            }
        });
    } catch (err) {
        return next(err);
    }
});

router.get("/me", authenticateJwt, (req, res) => {
    res.json({ user: toAuthUser(req.user) });
});

router.get("/admin", authenticateJwt, authorizeRoles("admin"), (req, res) => {
    res.json({
        message: "You are authorized as an admin.",
        user: toAuthUser(req.user),
    });
});

module.exports = router;
