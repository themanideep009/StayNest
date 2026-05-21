require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");

const ExpressError = require("./utils/ExpressError.js");
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user = require("./routes/user.js");
const meta = require("./routes/meta.js");
const apiAuth = require("./routes/apiAuth.js");
const { isGoogleAuthConfigured, isPhoneAuthConfigured } = require("./utils/auth.js");
const { configurePassport } = require("./utils/passport.js");
const { wantsJson } = require("./utils/jwt.js");
const { seedListingsIfEmpty } = require("./init/index.js");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/staynest";
const NODE_ENV = process.env.NODE_ENV || "development";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-change-me";
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

if (SESSION_SECRET === "dev-only-change-me") {
    console.warn("SESSION_SECRET is not set. Falling back to an insecure development secret.");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

if (NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
            secure: NODE_ENV === "production",
        },
    })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport, { appBaseUrl: APP_BASE_URL });

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.currentPath = req.path;
    res.locals.currentYear = new Date().getFullYear();
    res.locals.authProviders = {
        google: isGoogleAuthConfigured(),
        phone: isPhoneAuthConfigured() || NODE_ENV !== "production",
    };
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.get("/places", (req, res) => {
    res.redirect("/listings");
});

app.get(["/place", "/listing"], (req, res) => {
    res.redirect("/listings");
});

app.get("/healthz", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "staynest",
    });
});

app.use("/listings", listings);
app.use("/listings/:id/reviews", reviews);
app.use("/api/auth", apiAuth);
app.use("/", user);
app.use("/", meta);

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Something Went Wrong";

    if (err.statusCode >= 500) {
        console.error(err);
    }

    if (wantsJson(req)) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    res.status(err.statusCode).render("listings/error.ejs", { err });
});

async function connectDB() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
}

async function startServer() {
    try {
        await connectDB();
        await seedListingsIfEmpty();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { app, connectDB, startServer };
