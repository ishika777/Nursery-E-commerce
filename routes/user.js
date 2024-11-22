const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const passport = require("passport");
const User = require("../models/userModel.js");
const UserProfile = require("../models/userProfile.js");
const {saveRedirectUrl, isLoggedIn, isProfile} = require("../middleware.js");
const { reviewSchema } = require("../schema.js");
const {Payment, ShoppingCart} = require("../models/otherModel.js");
const { Order } = require("../models/orderModel.js");
const { Product } = require("../models/productModel.js");

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async(req, res, next) => {
    try{
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        req.session.user = registeredUser;
        req.login(registeredUser, err => {
            if(err){
                return next(err);
            }
            req.session.user = registeredUser;
            req.flash("success", "Welcome to Plant Nurdery!!");
            res.redirect("/home");
        });
    }
    catch(error){
        console.error("Signup Error:", error);
        req.flash("error", error.message);
        res.redirect("/home");
    }
}));

router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

router.post("/login", saveRedirectUrl, 
    passport.authenticate("user-local", 
        {
            failureRedirect: "/user/login", 
            failureFlash: true
        }
    ), wrapAsync(async (req, res) => {
        const user = await User.find({username : req.body.username})
        req.session.user = user[0];
        req.flash("success", "Welcome back to Plant Nursery!!");
        let redirectUrl = res.locals.redirectUrl || "/home";
        res.redirect(redirectUrl); 
    }
));

router.get("/logout", wrapAsync(async (req, res, next) => {
    req.logout((error) => {
        if(error){
            return next(error);
        }
        req.flash("success", "Logged out!!");
        res.redirect("/home");
    });
}));


router.get("/profile/new", (req, res) => {
    res.render("users/profile.ejs");
});

router.get("/profile/edit", wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const profile = await UserProfile.find({userid : userId});
    console.log(profile)
    res.render("users/editProfile.ejs", {profile});
}));

router.post("/profile", wrapAsync(async (req, res, next) => {
    try {
        const { name, address, city, state, postalcode, phonenumber } = req.body.userProfile;
        const newUserProfile = new UserProfile({
            userid: req.user._id, 
            name, address, city, state, 
            postalcode: Number(postalcode), 
            phonenumber: Number(phonenumber), 
        });
        await newUserProfile.save();

        geocoder.geocode(`${address}`, function(err, res) {
            console.log(res);
          });

        req.flash("success", "Profile created successfully!");
        res.redirect("/user/showProfile");
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while creating the profile.");
        res.redirect("/user/profile");
    }
}));

router.get("/showProfile", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userid: req.user._id });
        res.render("users/showProfile", { userProfile }); 
    } catch (error) {
        req.flash("error", "Could not load your profile.");
        res.redirect("/home");
    }
}));

router.get("/orderHistory", isLoggedIn, isProfile, wrapAsync(async (req, res) => {
    let allOrders =[];
    const payment = await Payment.find({userid : req.user._id})
    for(order of payment){
        const or = await Order.find({_id : order.orderid}).populate("cart")
        allOrders.push(or[0])
    }
    const products = await Product.find({});
    res.render("order/history.ejs", {allOrders, products});
}));

module.exports = router;