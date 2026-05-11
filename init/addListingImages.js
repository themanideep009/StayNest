require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const { data: sampleListings } = require("./data.js");

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/stayhub";

async function main() {
    await mongoose.connect(MONGO_URL);

    let updated = 0;
    for (const sample of sampleListings) {
        const images = [sample.image, ...(sample.images || [])]
            .filter(Boolean)
            .slice(0, 3);

        if (images.length < 2) {
            continue;
        }

        const matchListing = {
            $or: [
                { title: sample.title },
                { location: sample.location, country: sample.country },
            ],
        };
        const needsImages = {
            $or: [
                { images: { $exists: false } },
                { images: { $size: 0 } },
            ],
        };

        const result = await Listing.updateOne(
            {
                $and: [matchListing, needsImages],
            },
            {
                $set: {
                    image: images[0],
                    images,
                },
            }
        );

        updated += result.modifiedCount;
    }

    const listingsWithoutImages = await Listing.find({
        $or: [
            { images: { $exists: false } },
            { images: { $size: 0 } },
        ],
    }).sort({ createdAt: 1 });

    for (let i = 0; i < listingsWithoutImages.length; i++) {
        const sample = sampleListings[i % sampleListings.length];
        const images = [sample.image, ...(sample.images || [])]
            .filter(Boolean)
            .slice(0, 3);

        if (images.length < 2) {
            continue;
        }

        const result = await Listing.updateOne(
            { _id: listingsWithoutImages[i]._id },
            {
                $set: {
                    image: images[0],
                    images,
                },
            }
        );

        updated += result.modifiedCount;
    }

    console.log(`Added multiple images to ${updated} listing${updated === 1 ? "" : "s"}.`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
