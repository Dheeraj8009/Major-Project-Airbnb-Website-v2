if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const path = require('path');
const methodoverride = require('method-override');
const ejsMate = require('ejs-mate');

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingschema, reviewschema } = require('./schema.js');
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;   // ✅ Correct import for v6
const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

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

const dbURL = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbURL);
    }

main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

// ✅ Session setup (connect-mongo v6 syntax)
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600
});

store.on("error", (err) => {
  console.log("Error in Mongo Session Store:", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};


// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });


app.use(session(sessionOptions));
app.use(flash());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + current user middleware
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currUser = req.user;
  next();
});

// Routers
app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);

// ✅ Home route (add here, before 404 handler)
app.get("/", (req, res) => {
  res.redirect("/listings");   // or res.render("home");
});

// 404 handler
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  res.status(statusCode).render("error.ejs", { err });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});