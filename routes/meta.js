const express = require("express");
const router = express.Router();

const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn } = require("../utils/middleware.js");

const pages = {
    about: {
        title: "About Stayhub",
        lead: "Stayhub helps travelers discover memorable stays and gives hosts a simple way to share spaces they love.",
        sections: [
            {
                heading: "What We Do",
                body: "Browse listings, manage your own properties, and join the conversation through reviews. The app is designed to stay lightweight, friendly, and easy to use on both desktop and mobile.",
            },
            {
                heading: "Why It Matters",
                body: "Travel planning works better when the experience feels human. Stayhub keeps the experience focused on clear listings, useful information, and trusted ownership-based actions.",
            },
        ],
    },
    help: {
        title: "Help Center",
        lead: "Everything you need to use Stayhub smoothly.",
        sections: [
            {
                heading: "Create an Account",
                body: "Sign up with your email, username, and password. Once logged in, you can create listings, edit your own stays, and post reviews.",
            },
            {
                heading: "Manage Listings",
                body: "Use Add Listing to publish a stay. You can update or delete only the listings you own, and your dashboard keeps them all in one place.",
            },
            {
                heading: "Reviews",
                body: "Any logged-in user can leave a review. Review deletion is limited to the author of that review for better trust and safety.",
            },
        ],
    },
    privacy: {
        title: "Privacy Policy",
        lead: "Stayhub stores the information needed to run accounts, listings, and reviews.",
        sections: [
            {
                heading: "Data We Use",
                body: "We store account information, listing details, and review content so the application can authenticate users and display property information.",
            },
            {
                heading: "How It Is Used",
                body: "Your data is used to power sign in, ownership checks, listing management, and personalized experiences such as showing your dashboard and authored reviews.",
            },
        ],
    },
    terms: {
        title: "Terms of Use",
        lead: "Using Stayhub means keeping listings and reviews respectful, accurate, and lawful.",
        sections: [
            {
                heading: "Content Responsibility",
                body: "Users are responsible for the listings and reviews they publish. Misleading, abusive, or unauthorized content may be removed.",
            },
            {
                heading: "Account Safety",
                body: "Keep your credentials secure and avoid sharing access. Ownership-protected actions are tied directly to your signed-in account.",
            },
        ],
    },
};

router.get("/dashboard", isLoggedIn, async (req, res, next) => {
    try {
        const myListings = await Listing.find({ owner: req.user._id })
            .populate({
                path: "reviews",
                populate: { path: "author" },
            })
            .sort({ createdAt: -1 });
        const myBookings = await Booking.find({ guest: req.user._id })
            .populate({
                path: "listing",
                populate: { path: "owner" },
            })
            .sort({ checkin: 1, createdAt: -1 });

        const totalReviews = myListings.reduce((sum, listing) => sum + listing.reviews.length, 0);
        const totalValue = myListings.reduce((sum, listing) => sum + listing.price, 0);
        const totalBookingValue = myBookings.reduce((sum, booking) => sum + booking.total, 0);

        res.render("meta/dashboard", {
            myListings,
            myBookings,
            stats: {
                listingCount: myListings.length,
                reviewCount: totalReviews,
                averagePrice: myListings.length ? Math.round(totalValue / myListings.length) : 0,
                bookingCount: myBookings.length,
                bookingValue: totalBookingValue,
            },
        });
    } catch (err) {
        next(err);
    }
});

router.get("/host", (req, res) => {
    res.render("meta/host");
});

for (const slug of Object.keys(pages)) {
    router.get(`/${slug}`, (req, res) => {
        res.render("meta/info", { page: pages[slug], slug });
    });
}

module.exports = router;
