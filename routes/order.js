const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { Order, OrderItem } = require('../models/orderModel.js');
const { Product } = require('../models/productModel.js');
const { Payment } = require('../models/otherModel.js'); 
const {ShoppingCart} = require('../models/otherModel.js'); 


router.get("/payment", wrapAsync(async(req, res) => {
    const userId = req.user._id;
    const order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });
    if (!order) {
        req.flash('error', 'No pending orders found.');
        return res.redirect('/order');
    }
    res.render('order/payment', {totalamount : order.totalamount}); 
}))

router.post('/confirmation', wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const order = await Order.findOne({ userid: userId, orderstatus: 'Pending' });
    if (!order) {
        req.flash('error', 'No pending orders found.');
        return res.redirect('/order');
    }
    const { paymentMethod } = req.body;
    try {
        const payment = new Payment({
            userid : userId,
            orderid: order._id,
            paymentmethod: paymentMethod,
            paymentstatus: 'Completed', 
            paymentdate: new Date()
        });
        await payment.save();
        order.orderstatus = 'Confirmed'; 
        await order.save();
        const cart = await ShoppingCart.findOneAndUpdate({userid : userId, cartstatus : "Pending"},{ cartstatus : "Complete"});
        await cart.save();
        console.log("doneex")
    
       
        req.flash('success', 'Your order has been confirmed successfully!'); 
        res.render('order/confirmation', { messages: req.flash() }); 
    } 
    catch (error) {
        console.error("Error processing payment:", error);
        req.flash('error', 'Payment failed. Please try again.');
        res.redirect('order/payment'); 
    }  
}));

module.exports = router;
