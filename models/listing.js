const mongoose = require("mongoose");
const Review = require("./review.js");
const Booking = require("./booking.js");
const Schema = mongoose.Schema;

const listingSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            set: (v) => v === "" ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" : v,
        },
        images: {
            type: [String],
            default: [],
            set: (values) => Array.isArray(values) ? values.filter(Boolean).slice(0, 3) : [],
        },
        price: { type: Number, required: true },
        location: { type: String, required: true },
        country: { type: String, required: true },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

listingSchema.pre("validate", function (next) {
    if (this.images.length > 3) {
        this.images = this.images.slice(0, 3);
    }

    if (!this.image && this.images.length > 0) {
        this.image = this.images[0];
    }

    if (this.image && this.images.length === 0) {
        this.images = [this.image];
    }

    next();
});

// Cascade delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
        await Booking.deleteMany({ listing: listing._id });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
