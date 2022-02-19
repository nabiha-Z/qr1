import mongoose from "mongoose";

const surveySchema = mongoose.Schema({
    name: { type: String },
    address: { type: String },
    city: { type: String },
    description: { type: String },
    image: { type:String},
    user: { type:String },
    qrcode: { type:String }

});

export default mongoose.model("survey", surveySchema);