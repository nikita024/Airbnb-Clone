const express= require("express");
const app = express();
const mongoose = require("mongoose");
const Listing= require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const WrapAsyc = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const Review= require("./models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderhub";

main()
.then(() => {
 console.log("connected to DB");
})
 .catch((err) => {
    console.log(err)
 });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


app.get("/",(req,res) => {
    res.send("hi,I am root");
});

const validateListing = (req,res,next) => {
  let {error}= listingSchema.validate(req.body);

  if(error){
    let errMsg= error.details.map((el) => el.message).join(",");
    throw new ExpressError(errMsg, 400);
  } else {
    next();
  }
}

const validateReview = (req,res,next) => {
  let {error}= reviewSchema.validate(req.body);

  if(error){
    let errMsg= error.details.map((el) => el.message).join(",");
    throw new ExpressError(errMsg, 400);
  } else {
    next();
  }
}

// index route
app.get("/listings",WrapAsyc( async(req,res) => {
  const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
    }));

// New Route
  app.get("/listings/new", (req, res) =>{
    res.render("listings/new.ejs");
  })


 //show route
  app.get("/listings/:id",WrapAsyc (async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs",{ listing});
  }));

  //create route
  app.post("/listings",validateListing,
    WrapAsyc(async(req, res,next) => {
    const newListing = new Listing(req.body.listing);
     await newListing.save();
     res.redirect("/listings");
    })
  );
  

  // edit route
  app.get("/listings/:id/edit",WrapAsyc (async (req,res) => {
   let {id} = req.params;
   const listing = await Listing.findById(id);
   res.render("listings/edit.ejs",{listing});
  }));

  // update route
  app.put("/listings/:id",validateListing,
    WrapAsyc (async(req,res) => {
    
      let {id} = req.params;
      await Listing.findByIdAndUpdate(id,{...req.body.listing});
      res.redirect(`/listings/${id}`);
    })
  );
  
    
  

  // DELETE ROUTE
    app.delete("/listings/:id",WrapAsyc( async (req,res) =>{
      let {id} = req.params;
      let deletedListing = await Listing.findByIdAndDelete(id);
      console.log("deletedListing");
      res.redirect("/listings/${listing._id}");
    }));

    // reviews
    // Post 

     app.post("/listings/:id/reviews", validateReview, WrapAsyc(async(req, res)=>{
     let listing= await Listing.findById(req.params.id);
     let newReview = new Review(req.body.review);

     listing.reviews.push(newReview);
     await newReview.save();
     await listing.save();
     
     console.log("new review saved");
     res.send("new review saved");
  }));
  // delete route
  app.delete("/listings/:id/reviews/:reviewId",WrapAsyc( async (req,res) =>{
    let {id,reviewId} = req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
     await Review.findByIdAndDelete(reviewId);
   
    res.redirect(`/listings/${id}`);
  }));

//app.get("/testListing", (req,res) => {
  //  let sampleListing = new Listing ({
    //    title: "My new Villa",
      //  description:"By the beach",
        //location:"calangute, Goa",
        //price:1200,
        //country:"India",
    //});

app.all("*", (req, res, next) => {
  next(new ExpressError(404,"Page Not Found"));
});
 app.use((err, req, res, next) => {
  let {statusCode=500, message="something went wrong!"} = err;
  res.render("error.ejs",{message});
  // res.status(statusCode).send(message);
 });   


app.listen(8080, () => {
    console.log("server is listening to port 8080");

});
