const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const path = require('path');
const methodoverride = require('method-override');
const ejsMate = require('ejs-mate');

const wrapAsync = require ("./utils/wrapAsync.js");
const ExpressError = require ("./utils/ExpressError.js");
const { listingschema, reviewschema } = require('./schema.js');
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');


// const Review = require('./models/review.js');
const Review = require('./models/review');

const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');



app.engine('ejs', ejsMate);
app.use(methodoverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const dbURL = ATLASDB_URL;

async function main() {
  await mongoose.connect(dbURL);
    }

main()
  .then (() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.log(err);
});


const sessionOptions = {
  secret: 'mysupersecretcode',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};


app.get('/', (req, res) => {
  res.redirect('/listings');
});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currUser = req.user;
  next();
});

// app.get('/demouser', async (req, res) => {
//   let fakeUser = new User({ 
//     email: "student@gmail.com",
//     username: "student123" 
//   });
//   let registeredUser = await User.register(fakeUser, 'mypassword');
//   res.send(registeredUser);
// });



app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);

// app.get("/testListing", (req, res) => {
//   let sampleListing = new Listing({
//     title: "Sample Listing",
//     description: "This is a sample listing for testing.",
//     images: "",
//     price: 100,
//     location: "Sample Location",
//     country: "Sample Country"
//   });
//     sampleListing.save()
//     .then(() => {
//         console.log("Sample listing saved successfully!");
//         res.send("Sample listing saved successfully!");
//     })
//     .catch((err) => {
//         res.status(500).send("Error saving sample listing: " + err);
//     });
// });






app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// app.all("*", (req,res,next) => {
//   next(new ExpressError(404, "Page not found"));
// });

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "SOMETHING WENT WRONG!" } = err;
  res.status(statusCode).render("error.ejs", { err });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


