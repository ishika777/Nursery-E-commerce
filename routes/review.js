const express = require("express");
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const {Product} = require('../models/productModel.js');
const Review = require('../models/reviewModel.js')
const {validateReview, isReviewAuthor, isLoggedIn} = require("../middleware.js");

router.post("/",isLoggedIn, validateReview, wrapAsync(async(req, res) => {
    let product = await Product.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    product.reviews.push(newReview);
    await newReview.save();
    await product.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/home/${product._id}`);
}));

router.delete("/:reviewId",isLoggedIn, isReviewAuthor, wrapAsync(async(req, res) => {
    let{id, reviewId} = req.params;
    await Product.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    res.redirect(`/home/${id}`);
}));



module.exports = router;