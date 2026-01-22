const express= require("express");
const app=express();
const path = require("path");
const mongoose = require("mongoose")
const Listing=require("./models/listing.js");
const methodoverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const Review  =require("./models/review.js");
const Mongo_URL = "mongodb://127.0.0.1:27017/wanderlust";
const listings=require("./routes/listing.js");
const reviews=require("./routes/review.js");
const session=require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const user=require("./routes/user.js");



main().then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{ 
    console.log(err); 
})
async function main(){
    await mongoose.connect(Mongo_URL);
}
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodoverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
const sessionOptions = {
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
};
app.use(session(sessionOptions));
app.use(flash());

//Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


let port = 3000; 
app.listen(port,()=>{
    console.log("Server is Running on 3000");
})


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
});

//RegisterUser
app.get("/demouser", async(req,res)=>{
    let fakeUser= new User({
        email:"student@gmail.com",
        username:"delta-student",
    });
    let registeredUser = await User.register(fakeUser,"helloWorld");
    res.send(registeredUser);
})

app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/",user);

app.get('/',(req,res)=>{
    console.log("OK!!!!");
    res.send("Welcome  to the WanderLust");
})

// app.get('/testlisting',async(req,res)=>{
//     let sampleLisiting = new Listing({
//         title:"My New Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Hyderabad",
//         country:"India",
//     });
//     await sampleLisiting.save();
//     console.log("OK OK");
//     res.send("Successful testing");
// })




app.use((err,req,res,next)=>{
   let{statusCode=500,message="Something Went Wrong"}=err;
    res.status(statusCode).render("listings/error.ejs",{err});
})

app.all(/.*/,(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"));
});



