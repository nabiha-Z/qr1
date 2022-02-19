import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String },
    email: { type: String },
    dob: { type: String },
    contact:{ type: String },
    password: { type: String },
    resetToken: { type: String },
    expires: { type: Date }
});

export default mongoose.model("user", userSchema);