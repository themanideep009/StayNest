const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn, isOwner, validateListing } = require("../utils/middleware.js");

const featuredExperiences = [
    {
        icon: "fa-solid fa-person-hiking",
        title: "Guided Local Trails",
        description: "Plan sunrise hikes, heritage walks, and nature routes with hosts who know the area deeply.",
        meta: "Adventure-ready itineraries",
    },
    {
        icon: "fa-solid fa-utensils",
        title: "Food and Culture Picks",
        description: "Discover neighborhood cafes, regional dining spots, and cultural evenings matched to your stay.",
        meta: "Handpicked local flavor",
    },
    {
        icon: "fa-solid fa-camera-retro",
        title: "Photo-Perfect Moments",
        description: "Explore scenic viewpoints, hidden corners, and memorable stops for trips worth documenting.",
        meta: "Built for weekend escapes",
    },
];

const featuredServices = [
    {
        icon: "fa-solid fa-shield-heart",
        title: "Trusted Hosting",
        description: "Clear ownership, secure sessions, and review-based trust help guests book with confidence.",
    },
    {
        icon: "fa-solid fa-bell-concierge",
        title: "Smooth Booking Support",
        description: "Compare prices quickly, scan stay details fast, and move from discovery to decision without friction.",
    },
    {
        icon: "fa-solid fa-chart-line",
        title: "Host Dashboard",
        description: "Manage your places, track feedback, and update your hosted spaces from one organized view.",
    },
];

// Index — all listings
router.get("/", async (req, res) => {
    try {
        const {
            q = "",
            country = "",
            minPrice = "",
            maxPrice = "",
            sort = "newest",
        } = req.query;

        const filters = {};
        const searchTerm = q.trim();
        const selectedCountry = country.trim();
        const parsedMinPrice = minPrice !== "" ? Number(minPrice) : null;
        const parsedMaxPrice = maxPrice !== "" ? Number(maxPrice) : null;

        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, "i");
            filters.$or = [
                { title: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { description: searchRegex },
            ];
        }

        if (selectedCountry) {
            filters.country = new RegExp(`^${selectedCountry}$`, "i");
        }

        if (parsedMinPrice !== null || parsedMaxPrice !== null) {
            filters.price = {};
            if (parsedMinPrice !== null && !Number.isNaN(parsedMinPrice)) {
                filters.price.$gte = parsedMinPrice;
            }
            if (parsedMaxPrice !== null && !Number.isNaN(parsedMaxPrice)) {
                filters.price.$lte = parsedMaxPrice;
            }
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            priceAsc: { price: 1 },
            priceDesc: { price: -1 },
            title: { title: 1 },
        };

        const alllistings = await Listing.find(filters)
            .populate("owner")
            .sort(sortOptions[sort] || sortOptions.newest);

        const countries = await Listing.distinct("country");
        countries.sort((a, b) => a.localeCompare(b));

        const stats = await Listing.aggregate([
            {
                $lookup: {
                    from: "reviews",
                    localField: "reviews",
                    foreignField: "_id",
                    as: "reviewDocs",
                },
            },
            {
                $group: {
                    _id: null,
                    totalListings: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                    countries: { $addToSet: "$country" },
                    totalReviewCount: { $sum: { $size: "$reviewDocs" } },
                    totalRatingSum: { $sum: { $sum: "$reviewDocs.rating" } },
                },
            },
        ]);

        const summary = stats[0] || {
            totalListings: 0,
            avgPrice: 0,
            countries: [],
            totalReviewCount: 0,
            totalRatingSum: 0,
        };

        res.render("listings/index", {
            alllistings,
            featuredExperiences,
            featuredServices,
            filters: {
                q: searchTerm,
                country: selectedCountry,
                minPrice,
                maxPrice,
                sort,
            },
            countries,
            stats: {
                totalListings: summary.totalListings,
                avgPrice: Math.round(summary.avgPrice || 0),
                totalCountries: summary.countries.length,
                avgRating: summary.totalReviewCount
                    ? (summary.totalRatingSum / summary.totalReviewCount).toFixed(1)
                    : "New",
                resultCount: alllistings.length,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Something went wrong");
    }
});

// New form — protected
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new");
});

// Show single listing
router.get("/:id", async (req, res, next) => {
    let { id } = req.params;
    try {
        const listing = await Listing.findById(id)
            .populate({ path: "reviews", populate: { path: "author" } })
            .populate("owner");
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }
        res.render("listings/show", { listing });
    } catch (err) {
        next(err);
    }
});

router.post("/:id/book", isLoggedIn, async (req, res, next) => {
    const { id } = req.params;
    const { checkin = "", checkout = "" } = req.body;

    try {
        const listing = await Listing.findById(id).populate("owner");
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }

        if (listing.owner && listing.owner._id.equals(req.user._id)) {
            req.flash("error", "You cannot book your own listing.");
            return res.redirect(`/listings/${id}`);
        }

        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);

        if (
            !checkin ||
            !checkout ||
            Number.isNaN(checkinDate.getTime()) ||
            Number.isNaN(checkoutDate.getTime())
        ) {
            req.flash("error", "Please choose valid check-in and checkout dates.");
            return res.redirect(`/listings/${id}`);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        checkinDate.setHours(0, 0, 0, 0);
        checkoutDate.setHours(0, 0, 0, 0);

        if (checkinDate < today) {
            req.flash("error", "Check-in date cannot be in the past.");
            return res.redirect(`/listings/${id}`);
        }

        if (checkoutDate <= checkinDate) {
            req.flash("error", "Checkout must be at least one day after check-in.");
            return res.redirect(`/listings/${id}`);
        }

        const nights = Math.round((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        const total = nights * listing.price;
        await Booking.create({
            listing: listing._id,
            guest: req.user._id,
            checkin: checkinDate,
            checkout: checkoutDate,
            nights,
            total,
        });

        const formattedCheckin = checkinDate.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const formattedCheckout = checkoutDate.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

        req.flash(
            "success",
            `Booking confirmed for ${listing.title}: ${formattedCheckin} to ${formattedCheckout} (${nights} night${
                nights === 1 ? "" : "s"
            }) for Rs. ${total.toLocaleString("en-IN")}. You can see it in your dashboard.`
        );
        return res.redirect("/dashboard");
    } catch (err) {
        next(err);
    }
});

// Create listing — protected + validated
router.post("/", isLoggedIn, validateListing, async (req, res, next) => {
    try {
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        next(err);
    }
});

// Edit form — protected + owner only
router.get("/:id/edit", isLoggedIn, isOwner, async (req, res, next) => {
    let { id } = req.params;
    try {
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing you requested does not exist!");
            return res.redirect("/listings");
        }
        res.render("listings/edit", { listing });
    } catch (err) {
        next(err);
    }
});

// Update — protected + owner only + validated
router.put("/:id", isLoggedIn, isOwner, validateListing, async (req, res, next) => {
    let { id } = req.params;
    try {
        await Listing.findByIdAndUpdate(id, { $set: req.body.listing }, { runValidators: true });
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
});

// Delete — protected + owner only
router.delete("/:id", isLoggedIn, isOwner, async (req, res, next) => {
    let { id } = req.params;
    try {
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    } catch (err) {
        next(err);
    }
});

module.exports = router;
