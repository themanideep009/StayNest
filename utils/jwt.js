const jwt = require("jsonwebtoken");

const User = require("../models/user.js");

const DEFAULT_JWT_EXPIRES_IN = "7d";

function getJwtSecret() {
    return process.env.JWT_SECRET || process.env.SESSION_SECRET || "dev-only-change-me";
}

function getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;
}

function toAuthUser(user) {
    return {
        id: String(user._id),
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role || "user",
        authMethods: user.authMethods || [],
    };
}

function createJwtToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            username: user.username,
            role: user.role || "user",
        },
        getJwtSecret(),
        { expiresIn: getJwtExpiresIn() }
    );
}

function getBearerToken(req) {
    const authHeader = req.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (!/^Bearer$/i.test(scheme) || !token) {
        return null;
    }

    return token;
}

function wantsJson(req) {
    return req.path.startsWith("/api/") || req.accepts(["html", "json"]) === "json";
}

async function authenticateJwtFromHeader(req) {
    const token = getBearerToken(req);

    if (!token) {
        return null;
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);

    if (!user) {
        const error = new Error("Token user no longer exists.");
        error.name = "JsonWebTokenError";
        throw error;
    }

    req.user = user;
    req.auth = {
        strategy: "jwt",
        tokenPayload: payload,
    };

    return user;
}

function authenticateJwt(req, res, next) {
    authenticateJwtFromHeader(req)
        .then((user) => {
            if (!user) {
                return res.status(401).json({ error: "Missing bearer token." });
            }

            return next();
        })
        .catch(() => res.status(401).json({ error: "Invalid or expired token." }));
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        const userRole = req.user?.role || "user";

        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: "You do not have permission to access this resource." });
        }

        return next();
    };
}

module.exports = {
    authenticateJwt,
    authenticateJwtFromHeader,
    authorizeRoles,
    createJwtToken,
    toAuthUser,
    wantsJson,
};
