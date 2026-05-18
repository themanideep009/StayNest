const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const Mongo_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/staynest";

async function connectInitDB() {
    await mongoose.connect(Mongo_URL);
    console.log("Connected to DB");
}

async function seedListingsIfEmpty() {
    const listingCount = await Listing.countDocuments();

    if (listingCount > 0) {
        console.log(`Seed skipped: ${listingCount} listing${listingCount === 1 ? "" : "s"} already exist.`);
        return;
    }

    await Listing.insertMany(initdata.data);
    console.log("Sample listings initialized");
}

async function initDB() {
    await connectInitDB();
    await seedListingsIfEmpty();
}

if (require.main === module) {
    initDB().catch((err) => {
        console.log(err);
    });
}

module.exports = {
    connectInitDB,
    seedListingsIfEmpty,
    initDB,
};
