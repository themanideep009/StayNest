const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        guest: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        checkin: {
            type: Date,
            required: true,
        },
        checkout: {
            type: Date,
            required: true,
        },
        nights: {
            type: Number,
            required: true,
            min: 1,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
