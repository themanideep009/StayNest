// DEBUG ENDPOINT - REMOVE BEFORE PRODUCTION
// This helps diagnose and fix authentication issues

const express = require("express");
const User = require("../models/user.js");

const router = express.Router();

// Check all users in database
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({});
        const userInfo = users.map(u => ({
            id: u._id,
            username: u.username,
            email: u.email,
            authMethods: u.authMethods || [],
            hasHash: !!u.hash,
            hasSalt: !!u.salt,
            phoneVerified: u.phoneVerified,
        }));
        res.json({
            totalUsers: users.length,
            users: userInfo
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a test user with hashed password
router.post("/create-test-user", async (req, res) => {
    try {
        const { username = "testuser", email = "test@example.com", password = "Test@1234" } = req.body;

        // Check if user exists
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.json({ 
                message: "User already exists",
                user: {
                    username: existing.username,
                    email: existing.email,
                    hasHash: !!existing.hash,
                }
            });
        }

        // Create new user with register method (properly hashes password)
        const newUser = new User({ 
            username, 
            email, 
            authMethods: ["local"] 
        });
        
        const registeredUser = await User.register(newUser, password);
        
        res.status(201).json({ 
            message: "Test user created successfully",
            user: {
                id: registeredUser._id,
                username: registeredUser.username,
                email: registeredUser.email,
                authMethods: registeredUser.authMethods,
                hasHash: !!registeredUser.hash,
            },
            credentials: {
                username,
                password,
                note: "Use these to login"
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fix password for existing user
router.post("/fix-user-password/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { password = "Password@123" } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Use setPassword method to properly hash
        await user.setPassword(password);
        await user.save();

        res.json({ 
            message: "Password updated successfully",
            user: {
                username: user.username,
                email: user.email,
                hasHash: !!user.hash,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test authentication
router.post("/test-login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const authenticate = User.authenticate();
        authenticate(username, password, (err, authenticatedUser, options) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!authenticatedUser) {
                return res.status(401).json({ 
                    error: "Authentication failed",
                    details: options?.message || "Invalid password",
                    debug: {
                        userExists: !!user,
                        hasHash: !!user.hash,
                        hasSalt: !!user.salt,
                    }
                });
            }

            res.json({ 
                message: "Authentication successful",
                user: {
                    id: authenticatedUser._id,
                    username: authenticatedUser.username,
                    email: authenticatedUser.email,
                }
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
