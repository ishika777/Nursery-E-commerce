const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const passport = require("passport");
const Product = require("../models/productModel.js");
const Admin = require("../models/adminModel.js");
const {saveRedirectUrl} = require("../middleware.js");

router.get("/signup", (req, res) => {
    res.render("admin/signup.ejs");
});

router.post("/signup", wrapAsync(async(req, res) => {
    try{
        console.log("Request Body:", req.body);
        let {username, email, password} = req.body;
        const newAdmin = new Admin({email, username});
        const registeredAdmin = await Admin.register(newAdmin, password);
        req.login(registeredAdmin, err => {
            if(err){
                return next(err);
            }
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
    res.render("admin/login.ejs");
});

router.post("/login", saveRedirectUrl, 
    passport.authenticate("admin-local", {failureRedirect: "/admin/login", failureFlash: true}), 
        wrapAsync(async(req, res) => {
            req.flash("success", "Welcome back to Plant Nursery!!");
            let redirectUrl = res.locals.redirectUrl || "/home";
            res.redirect(redirectUrl);
}));

router.get("/logout", wrapAsync(async(req, res, next) => {
    req.logout((error) => {
        if(error){
            return next(error);
        }
        req.flash("success", "Logged out!!");
        return res.redirect("/home");
    });
}));

module.exports = router;