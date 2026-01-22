const mongoose = require("mongoose");
const Review = require("./review.js"); 
const Schema = mongoose.Schema;


const listingSchema = new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    image:{type:String,default:"https://unsplash.com/photos/white-concrete-building-under-blue-sky-during-daytime-mR1CIDduGLc",set:(v)=>v ===""?"https://unsplash.com/photos/white-concrete-building-under-blue-sky-during-daytime-mR1CIDduGLc":v, },
    price:{type:Number,required:true,},
    location:{type:String,required:true,},
    country:{
        type:String,
        required:true,},
        reviews:[
            {
                type:Schema.Types.ObjectId,
                ref:"Review"
            }
        ]
});

listingSchema.post("findOneAndDelete",async (listing)=>{
    if(listing){
        await review.deleteMany({_id:{$in:listing.reviews}});
    }
})

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing;