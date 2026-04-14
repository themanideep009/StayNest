const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {
    isLoggedIn,
    isReviewAuthor,
    validateReview,
} = require("../utils/middleware.js");

// Post review — protected
router.post("/", isLoggedIn, validateReview, async (req, res, next) => {
    try {
        let listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }

        let newReview = new Review(req.body.review);
        newReview.author = req.user._id;
        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();
        req.flash("success", "New Review Posted!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        next(err);
    }
});

// Delete review — protected
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, async (req, res, next) => {
    try {
        let { id, reviewId } = req.params;
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review Deleted!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
