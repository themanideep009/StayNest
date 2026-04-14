const Joi = require("joi");


module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().trim().min(3).max(120).required(),
        description: Joi.string().trim().min(10).max(2000).required(),
        location: Joi.string().trim().min(2).max(120).required(),
        country: Joi.string().trim().min(2).max(80).required(),
        price: Joi.number().required().min(0),
        image: Joi.string().trim().uri().allow("", null),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().trim().min(5).max(1000).required()
    }).required()
});

module.exports.userSchema = Joi.object({
    user: Joi.object({
        username: Joi.string()
            .trim()
            .pattern(/^[a-zA-Z0-9._-]{3,30}$/)
            .required()
            .messages({
                "string.pattern.base": "Username can use letters, numbers, dots, underscores, and hyphens only.",
            }),
        email: Joi.string().trim().email().required(),
        password: Joi.string().min(6).max(128).required(),
    }).required(),
});
