const Joi = require('joi');

// ✅ Listing schema (flat structure)
module.exports.listingSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty'
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  location: Joi.string().required().messages({
    'any.required': 'Location is required',
    'string.empty': 'Location cannot be empty'
  }),
  country: Joi.string().required().messages({
    'any.required': 'Country is required',
    'string.empty': 'Country cannot be empty'
  }),
  price: Joi.number().required().min(1).messages({
    'any.required': 'Price is required',
    'number.min': 'Price must be at least 1'
  }),
  image: Joi.string().allow("", null)
});

// ✅ Review schema (still nested, since your form likely sends { review: { ... } })
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5).messages({
      'any.required': 'Rating is required',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot be more than 5'
    }),
    comment: Joi.string().required().messages({
      'any.required': 'Comment is required',
      'string.empty': 'Comment cannot be empty'
    })
  }).required()
});