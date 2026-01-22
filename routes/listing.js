const express = require("express");
const router = express.Router();
const Listing=require("../models/listing.js");
const ExpressError=require("../utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("../schema.js");


const ValidateListing = (req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};

//all items 
router.get("/",async(req,res)=>{
   try{const alllistings = await Listing.find({});
   res.render("listings/index",{alllistings});
   }
   catch(err){
    console.log(err);res.status(500).send("Something went wrong");
   }
})

//Add new list
router.get("/new",async (req,res)=>{
    res.render("listings/new",)
})

//according to id
router.get("/:id",async (req,res)=>{
    let  {id}=req.params;
    const listing =await Listing.findById(id).populate("reviews");
    if(!listing){
        req.flash("error","Listing you requested for does not exits!");
        return res.redirect("/listings");
    }
    res.render("listings/show",{listing});
})


//Create Post new info into data
router.post("/",ValidateListing, async (req,res,next)=>{
    // let {title,description,price,image,location,country}=req.body;
    // console.log(title);
    try{
        // let result=listingSchema.validate(req.body);
        // console.log(result);
        // if(result.err){
        //     throw new ExpressError(400,result.err);
        // }
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        req.flash("success","New Listing Created!");
        res.redirect("/listings");}
        catch(err){
            next(err);
    }
    
})

//update route
router.put("/:id",async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
})

//Delete route
router.delete("/:id",async (req,res)=>{
    let {id}=req.params;
    let deletelisting=await Listing.findByIdAndDelete(id);
    console.log(deletelisting);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
})
//edit the info
router.get("/:id/edit",async (req,res)=>{
    let {id}=req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash("error","Listing you requested for does not exits!");
        return res.redirect("/listings");
    }
    res.status(200).render("listings/edit",{listing});
})


module.exports = router;