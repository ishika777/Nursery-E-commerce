const ExpressError = require("./utils/expressError.js");
const Review = require("./models/reviewModel.js");
const {reviewSchema} = require("./schema.js");
const UserProfile = require("./models/userProfile.js")

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// module.exports.isLoggedIn = (req, res, next) => {
//     if(!req.isAuthenticated()){
//         req.session.redirectUrl = req.originalUrl;
//         req.flash("error", "You must be logged in");
//         if (req.user && req.user instanceof Admin) {
//             return res.redirect("/admin/login");
//         } else if (req.user && req.user instanceof User) {
//             return res.redirect("/user/login");
//         } else {
//             // If no role is determined, redirect to a default login page (optional)
//             return res.redirect("/user/login");
//         }
//     }
//     next();
// };

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'You must be logged in');
        return res.redirect('/user/login');
    }
    next();
};

// module.exports.ensureAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return next(); 
//     }
//     req.session.redirectUrl = req.originalUrl; 
//     res.redirect("/user/login"); 
// };

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(", ");
        req.flash("error", errMsg);
        return res.redirect(`/home/${req.params.id}`);
    }
    next();
};

module.exports.isReviewAuthor = async(req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currentUser._id)){
        req.flash("error", "You are not the author of this review!");
        return res.redirect(`/home/${id}`);
    }
    next();
};

module.exports.isProfile = async(req, res, next) => {
    if(!req.session.user){
        req.flash('error', 'You must be logged in');
        return res.redirect('/user/login');
    }else{
        const profile = await UserProfile.find({userid : req.session.user._id});
        if(profile.length === 0){
            req.flash("error", "Complete your Account details");
            return res.redirect("/user/profile/new");
        }
    }
    next();
};