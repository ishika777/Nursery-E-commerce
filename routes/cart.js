const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const wrapAsync = require("../utils/wrapAsync.js");
const {ShoppingCart} = require('../models/otherModel.js'); 
const {Order} = require('../models/orderModel.js');
const {Product} = require('../models/productModel.js');
const {isProfile, isLoggedIn} = require("../middleware.js") 

// Get Cart Route
router.get('/', wrapAsync(async (req, res) => { 
    try {
        const order = await Order.findOne({ userid: req.user._id, orderstatus: 'Pending' });
        let cart;
        if(order){
            cart = await ShoppingCart.findOne({ userid: req.user._id, cartstatus: 'Pending' }).populate("product");
        }
        res.render('order/cart', { cart,idx : 0,  messages: req.flash() }); 
    } 
    catch (error) {
        console.error("eeeee", error);
        req.flash('error', 'An error occurred while fetching the cart.');
        res.redirect('/home');
    }
}));

// Add to Cart Route
router.post('/:productId/add', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user._id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect(`/home/${productId}`);
        }
        if (product.quantity <= 0) {
            req.flash('error', 'Product is out of stock.');
            return res.redirect(`/home/${productId}`);
        }
        product.quantity -= 1;
        await product.save();

        let shoppingCartItem = await ShoppingCart.findOne({ userid: userId, cartstatus: "Pending" });
        if(!shoppingCartItem){
            shoppingCartItem = new ShoppingCart({
                cartstatus : "Pending",
                userid: userId,
                product: [product._id],
                quantity : 1,
                price: product.price
            });
        }else{
            let idx = 0;
            let found = false;
            for(item of shoppingCartItem.product){
                if(item.equals(product._id)){
                    found = true;
                    shoppingCartItem.quantity[idx]++;
                    shoppingCartItem.price += product.price;
                }
                idx++;
            }
            if(found === false){
                shoppingCartItem.product.push(product._id)
                shoppingCartItem.quantity.push(1);
                shoppingCartItem.price += product.price;

            }
        }
        await shoppingCartItem.save();

        let order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });

        if (!order) {
            order = new Order({
                userid: userId,
                orderstatus: 'Pending',
                cart : shoppingCartItem._id,
                totalamount: 0,
                shippingaddress: '',
            });
            await order.save();
        }


        order.totalamount += product.price;
        await order.save();

        shoppingCartItem.orderid = order._id;
        await shoppingCartItem.save();

        req.flash('success', 'Product added to cart successfully.');
        res.redirect(`/home/${productId}`);
    } 
    catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while adding the product to the cart.');
        res.redirect(`/home/${productId}`);
    }
});


router.post('/:productId/inc', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user._id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found.');
            return res.redirect(`/home/${productId}`);
        }
        if (product.quantity <= 0) {
            req.flash('error', 'Product is out of stock.');
            return res.redirect(`/home/${productId}`);
        }
        product.quantity -= 1;
        await product.save();

        let shoppingCartItem = await ShoppingCart.findOne({ userid: userId, cartstatus: "Pending" }).populate("product");
        if(!shoppingCartItem){
            req.flash('error', 'Product not found.');
            return res.redirect(`/home/${productId}`);
        }else{
            let idx = 0;
            let found = false;
            for(item of shoppingCartItem.product){
                if(item.equals(product._id)){
                    found = true;
                    shoppingCartItem.quantity[idx]++;
                    shoppingCartItem.price += product.price;
                }
                idx++;
            }
            if(found === false){
                req.flash('error', 'Product not found.');
                return res.redirect(`/home/${productId}`);
            }
        }
        await shoppingCartItem.save();

        let order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });

        if (!order) {
            req.flash('error', 'Product not found.');
            return res.redirect(`/home/${productId}`);
        }
        order.totalamount += product.price;
        await order.save();
        res.redirect(`/cart`);
    } 
    catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while adding the product to the cart.');
        res.redirect(`/cart`);
    }
});

router.post('/:productId/dec', async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user._id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found.'); 
            return res.redirect(`/home/${productId}`);
        }
        product.quantity += 1;
        await product.save();


        let order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });
        order.totalamount -= product.price;
        await order.save();


        let shoppingCartItem = await ShoppingCart.findOne({ userid: userId, cartstatus: "Pending" }).populate("product");
        let idx = 0;
        if(Array.isArray(shoppingCartItem.quantity) && shoppingCartItem.quantity.length === 1 && shoppingCartItem.quantity[0] === 1){
            console.log(shoppingCartItem)
            const ordid = shoppingCartItem.orderid;
            console.log(ordid)
            await ShoppingCart.findByIdAndDelete(shoppingCartItem._id);
            await Order.findByIdAndDelete(ordid);
            return res.redirect("/cart")
        }
        for(item of shoppingCartItem.product){
            if(item._id.equals(product._id)){
                if(shoppingCartItem.quantity[idx] == 1){
                    await ShoppingCart.updateOne({ _id: shoppingCartItem._id },{ $pull: { product: product._id } })
                    shoppingCartItem.quantity.splice(idx, 1)
                }else{
                    shoppingCartItem.quantity[idx] -=1;
                }
                shoppingCartItem.price -= product.price;
            }
            idx++;
        }    
        await shoppingCartItem.save();
        res.redirect(`/cart`);
    } 
    catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while deleting the product from the cart.');
        res.redirect(`/cart`);
    }
});

router.get('/empty', wrapAsync(async (req, res) => {
    try {
        const userId = req.user._id;
        const order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });
        const cart = await ShoppingCart.findOne({userid : userId, orderid : order._id}).populate("product");

        let idx = 0;
        for(item of cart.product){
            const product = await Product.findById(item._id);
            product.quantity += cart.quantity[idx];
            await product.save();
            idx++;
        }
        await ShoppingCart.findByIdAndDelete(cart._id);
        await Order.findByIdAndDelete(order._id);

        req.flash("success", "Your Cart is empty!");
        res.redirect("/home");
    } 
    catch (error) {
        console.error('Error fetching order items:', error);
        req.flash('error', 'An error occurred while emptying your order.');
        res.redirect('/home'); 
    }
}));

router.get('/order',isLoggedIn, isProfile, wrapAsync(async (req, res) => {
    try {
        const userId = req.user._id; 
        const order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });

        const cart = await ShoppingCart.findOne({userid : userId, orderid : order._id}).populate("product");

        res.render('order/order', {cart, idx : 0, totalAmount : order.totalamount, messages: req.flash() 
        });
    } 
    catch (error) {
        console.error('Error fetching order items:', error);
        req.flash('error', 'An error occurred while fetching your order.');
        res.redirect('/home'); 
    }
}));

module.exports = router;