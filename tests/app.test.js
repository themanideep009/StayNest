const request = require("supertest");
const mongoose = require("mongoose");
const { app, connectDB } = require("../app.js");

beforeAll(async () => {
    // Connect to the database
    await connectDB();
});

afterAll(async () => {
    // Close the database connection cleanly
    await mongoose.connection.close();
});

describe("StayNest Integration Tests", () => {
    test("GET /healthz returns status 200 and healthy status", async () => {
        const res = await request(app).get("/healthz");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            status: "ok",
            service: "staynest"
        });
    });

    test("GET / redirects to /listings", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe("/listings");
    });

    test("GET /nonexistent returns 404 page", async () => {
        const res = await request(app).get("/nonexistent-endpoint-xyz");
        expect(res.statusCode).toBe(404);
        expect(res.text).toContain("Page Not Found");
    });
});
