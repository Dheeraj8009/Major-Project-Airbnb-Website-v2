const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require('../schema.js');
const Listing = require('../models/listing');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');

const listingController = require('../controllers/listings');

// ✅ Import Cloudinary + Multer setup
const { cloudinary, upload } = require('../cloudConfig');

// -------------------- ROUTES --------------------

// New Route → display form for creating a new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Index + Create
router.route("/")
  .get(wrapAsync(listingController.index))     
  // 🔑 Multer must run before validation so req.body is populated
  .post(
    isLoggedIn,
    upload.single("listing[image]"),   // ✅ Multer parses multipart form first
    validateListing,                   // ✅ Joi validates req.body.listing after Multer
    wrapAsync(listingController.createListing)
  );

// Show + Update + Delete
router.route("/:id")
  .get(wrapAsync(listingController.showListing))           
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),   // ✅ Multer parses edit form first
    validateListing,                   // ✅ Joi validates req.body.listing
    wrapAsync(listingController.updateListing)
  )     
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destoryListing));

// Edit form
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;