const Listing = require('../models/listing');
const { cloudinary } = require('../cloudConfig');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


// Helper to wrap Cloudinary upload in a Promise
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'Wanderlust_DEV' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(fileBuffer);
  });
}

// Show all listings
module.exports.index = async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { listings: allListings });
  } catch (err) {
    res.status(500).send("Error retrieving listings: " + err);
  }
};

// Render form for new listing
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show a specific listing
module.exports.showListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");

    if (!listing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    res.status(500).send("Error retrieving listing: " + err);
  }
};

// Create a new listing with Cloudinary image upload
module.exports.createListing = async (req, res) => {

  let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
  .send();

  try {
    let imageData = {
      url: "https://images.unsplash.com/photo-1669669259279-0014747f4444?...",
      public_id: null
    };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageData = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    const newListing = new Listing({
      ...req.body.listing,
      image: imageData,
      owner: req.user._id,
      geometry: response.body.features[0].geometry
    });

    await newListing.save(); // 🔑 ensures persistence
    console.log("New listing created:", newListing);
    req.flash('success', 'Successfully created a new listing!');
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error("Listing creation error:", err);
    req.flash('error', 'Something went wrong');
    res.redirect('/listings/new');
  }
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash('error', 'Listing not found!');
    return res.redirect('/listings');
  }

  res.render("listings/edit.ejs", { listing });
};

// Update listing with Cloudinary image replacement
module.exports.updateListing = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash('error', 'Listing not found!');
      return res.redirect('/listings');
    }

    if (req.file) {
      if (listing.image && listing.image.public_id) {
        await cloudinary.uploader.destroy(listing.image.public_id);
      }

      const result = await uploadToCloudinary(req.file.buffer);
      listing.image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    // Update other fields
    listing.title = req.body.listing.title;
    listing.description = req.body.listing.description;
    listing.price = req.body.listing.price;
    listing.location = req.body.listing.location;
    listing.country = req.body.listing.country;

    await listing.save();
    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error("Listing update error:", err);
    req.flash('error', 'Something went wrong');
    res.redirect('/listings');
  }
};

// Delete listing + Cloudinary image cleanup
module.exports.destoryListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);

  if (listing && listing.image.public_id) {
    await cloudinary.uploader.destroy(listing.image.public_id);
  }

  req.flash('success', 'Successfully deleted the listing!');
  res.redirect("/listings");
};