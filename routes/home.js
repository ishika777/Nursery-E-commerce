const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {Product, Category} = require('../models/productModel.js');
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

// Main home route
router.get('/', async (req, res) => {
    try {
        const allProducts = await Product.find().populate('category'); 
        res.render('home/home', {allProducts}); 
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Search Route
router.get('/search', async (req, res) => {
    const query = req.query.query; 
    if (!query || typeof query !== 'string') {
        req.flash('error', 'Invalid search query.');
        return res.redirect('/home');
    }
    try {
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        });
        res.render('home/search', { products, query });
    } 
    catch (error) {
        console.error("Error occurred during product search:", error);
        req.flash('error', 'An error occurred while searching for products.');
        res.redirect('/home');
    }
});

// Route for Indoor Plants
router.get('/indoorPlants', wrapAsync(async (req, res) => {
    try {
        const indoorCategory = await Category.findOne({ categoryname: 'Indoor Plant' });
        if (!indoorCategory) {
            console.log("Indoor category not found"); 
            return res.status(404).send("Indoor category not found");
        }
        const indoorPlants = await Product.find({ category: indoorCategory._id }).populate('category');
        res.render('plants/indoorPlants', { indoorPlants });
    } catch (error) {
        console.error("Error fetching indoor plants:", error);
        res.status(500).send("Internal Server Error");
    }
}));

// Route for Outdoor Plants
router.get('/outdoorPlants', wrapAsync(async (req, res) => {
    try {
        const outdoorCategory = await Category.findOne({ categoryname: 'Outdoor Plant' });
        if (!outdoorCategory) {
            console.log("Outdoor category not found"); 
            return res.status(404).send("Outdoor category not found");
        }
        const outdoorPlants = await Product.find({ category: outdoorCategory._id }).populate('category');
        res.render('plants/outdoorPlants', { outdoorPlants });
    } catch (error) {
        console.error("Error fetching Outdoor plants:", error);
        res.status(500).send("Internal Server Error");
    }
}));

// Route for Succulents
router.get('/succulents', wrapAsync(async (req, res) => {
    try {
        const succulentsCategory = await Category.findOne({ categoryname: 'Succulents' });
        if (!succulentsCategory) {
            console.log("Succulents category not found"); 
            return res.status(404).send("Succulents category not found");
        }
        const succulentsPlants = await Product.find({ category: succulentsCategory._id }).populate('category');
        res.render('plants/succulents', { succulentsPlants });
    } catch (error) {
        console.error("Error fetching Succulents plants:", error);
        res.status(500).send("Internal Server Error");
    }
}));

// Route for Herbs
router.get('/herbs', wrapAsync(async (req, res) => {
    try {
        const herbsCategory = await Category.findOne({ categoryname: 'Herbs' });
        if (!herbsCategory) {
            console.log("Herbs category not found"); 
            return res.status(404).send("Herbs category not found");
        }
        const herbPlants = await Product.find({ category: herbsCategory._id }).populate('category');
        res.render('plants/herbs', { herbPlants });
    } catch (error) {
        console.error("Error fetching herbs plants:", error);
        res.status(500).send("Internal Server Error");
    }
}));

// Route for Flowers
router.get('/flowers', wrapAsync(async (req, res) => {
    try {
        const flowersCategory = await Category.findOne({ categoryname: 'Flowering Plants' });
        if (!flowersCategory) {
            console.log("Flowers category not found"); 
            return res.status(404).send("Flowers category not found");
        }
        const flowerPlants = await Product.find({ category: flowersCategory._id }).populate('category');
        console.log(flowerPlants)
        res.render('plants/flowers', { flowerPlants });
    } catch (error) {
        console.error("Error fetching flower plants:", error);
        res.status(500).send("Internal Server Error");
    }
}));

// Router for new
router.get("/new", async(req, res) => {
    const categories = await Category.find();
    res.render("home/new.ejs", { categories });
});

router.post("/", upload.single("product[image]"), wrapAsync(async(req, res, next) => {
    const { name, description, image, price, quantity, category } = req.body.product;
    if (!req.file) {
        req.flash("error", "Image upload failed.");
        return res.redirect("/home");
    }
    let url = req.file.path; 
    let filename = req.file.filename;
    const newProduct = new Product({
        name, description, image: { url, filename }, price, quantity, category 
    });
    await newProduct.save();
    req.flash("success", "New Product Added!");
    res.redirect("/home");
}));

// Router for show
router.get("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const product = await Product.findById(id).populate({
        path: 'reviews',
        populate: {
          path: 'author',
          model: 'User'   
        }
      })
    if(!product){
        req.flash("error", "Product you requested for does not exist!");
        res.redirect("/home");
    }
    res.render("home/show.ejs", {product});
}));

// Router for edit
router.get("/:id/edit", wrapAsync(async(req, res) => {
    let {id} = req.params;
    const product = await Product.findById(id).populate("category");
    if(!product){
        req.flash("error", "Product you requested for does not exist!");
        res.redirect("/home");
    }
    let originalImageUrl = product.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("home/edit.ejs", {product, originalImageUrl});
}));

// Router for update
router.put("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const old = await Product.findById(id);
    const oldPic = old.image.url;
    let imageUrl = req.body.product.image && req.body.product.image.url ? req.body.product.image.url : oldPic;

    let product = await Product.findByIdAndUpdate(id, {
        ...req.body.product,  // Spread the rest of the fields
        image: {               // Conditionally update the image field
            url: imageUrl,
            filename: req.body.product.image ? req.body.product.image.filename : undefined
        }
    }, { new: true });  
    // let product = await Product.findByIdAndUpdate(id, {...req.body.listing});
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        product.image = {url, filename};
    }
    await product.save();
    req.flash("success", "Product Updated!");
    res.redirect(`/home/${id}`);
}));

// Router for delete
router.delete("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Product.findByIdAndDelete(id);
    req.flash("success", "Product Deleted!");
    res.redirect("/home");
}));

module.exports = router;
