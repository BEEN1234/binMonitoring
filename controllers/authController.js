const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

require('../models/user');
const User = mongoose.model('UserSchema');

exports.authorizeUser = async (req, res, next) => {
    const { user } = await User.authenticate()(req.body.email, req.body.password);
    // console.log('user from authContr: '+ JSON.stringify(user)); //why
    var authBody = {user: req.body.email};
    var token = jwt.sign(authBody, process.env.SECRET);

    var userObj = user.toObject(); //err here..

    userObj.binMaster.authToken = token;
    res.status(200).json(userObj.binMaster);
}

exports.authorizeToken = async (req, res, next) => {//I would really like to authorize people here, then append the user to the req body
    const authToken = req.body.authToken;
    const authBody = jwt.verify(authToken, process.env.SECRET);
    req.authorizedUser = authBody.user;

    next();
}

exports.loginToken = async (req, res, next) => {
    var user = await User.findOne({email: req.authorizedUser});
    user = user.toObject();
    user.binMaster.user = req.authorizedUser;
    res.status(200).json(user.binMaster);
}