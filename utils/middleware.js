const ExpressError = require("./ExpressError.js");
const { listingSchema, reviewSchema, userSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// ─── Auth Guards ─────────────────────────────────────────────────────────────

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        } else if (req.get("referer")) {
            try {
                req.session.redirectUrl = new URL(req.get("referer")).pathname;
            } catch (err) {
                req.session.redirectUrl = "/listings";
            }
        }
        req.flash("error", "You must be logged in to do that!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }
    next();
};

// ─── Ownership Guard ─────────────────────────────────────────────────────────

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }

    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You don't have permission to do that!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

// ─── Validation Middleware ────────────────────────────────────────────────────

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

module.exports.validateUser = (req, res, next) => {
    const payload = {
        user: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        },
    };

    let { error } = userSchema.validate(payload);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    next();
};

module.exports.validatePhoneAuthStart = (req, res, next) => {
    if (req.body.purpose === "signup") {
        const username = String(req.body.username || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!/^[a-z0-9]{3,30}$/i.test(username)) {
            throw new ExpressError(400, "Username must be 3-30 letters or numbers.");
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ExpressError(400, "Please enter a valid email address.");
        }
    }

    next();
};
