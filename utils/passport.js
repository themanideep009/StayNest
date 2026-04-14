const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const LocalStrategy = require("passport-local");

const User = require("../models/user.js");
const { findOrCreateGoogleUser, isGoogleAuthConfigured } = require("./auth.js");

function configurePassport(passport, { appBaseUrl }) {
    passport.use(new LocalStrategy(User.authenticate()));

    if (isGoogleAuthConfigured()) {
        passport.use(
            "google",
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${appBaseUrl}/auth/google/callback`,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const user = await findOrCreateGoogleUser(profile);
                        done(null, user);
                    } catch (error) {
                        done(error);
                    }
                }
            )
        );
    }

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
}

module.exports = { configurePassport };
