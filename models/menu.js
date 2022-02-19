import mongoose from "mongoose";

const menuSchema = mongoose.Schema({
    resturantName: { type: String },
    address: { type: String },
    city: { type: String },
    name: { type: String },
    contact: { type: String },
    items: { type:Array }, 
    user: { type:String },
    qrcode: { type:String }
});

export default mongoose.model("menu", menuSchema);