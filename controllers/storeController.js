const mongoose = require('mongoose');

require('../models/catalogue');
require('../models/inventory');
require('../models/user.js');
const Catalogue = mongoose.model('Catalogue');
const Inventory = mongoose.model('Inventory');
const User = mongoose.model('UserSchema');

exports.populateStore = async (req, res) => {
    const results = await Catalogue.findOne({});
    res.status(200).send(results);
}

exports.buy = async (req, res, next) => {
    //authenticate incoming request
    const user = await User.findOne({user: req.authorizedUser});
    if(!user){
        res.status(400).send("forbidden request");
        return;
    };
    var product = await Inventory.findOneAndDelete({class: req.body.productClass}); //todo, clean this all up
    product = product.toObject();
    delete product._id;
    // console.log('product: '+ JSON.stringify(product));
    // console.log('req.body: '+ JSON.stringify(req.body));
    // console.log('user: '+ JSON.stringify(user));
    user.binMaster.vCables.push(product);
    user.binMaster.ownedCables.push(product);
    await user.save();
    //todo handle no more items to sell
    res.status(200).send(product);
}