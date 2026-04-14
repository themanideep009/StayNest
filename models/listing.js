const mongoose = require("mongoose");
const Review = require("./review.js");
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

// Cascade delete reviews when listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
