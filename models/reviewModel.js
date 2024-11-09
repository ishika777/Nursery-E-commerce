const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now 
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
