const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
// require('dotenv').config({ path: 'variables.env' });

require('../models/user');
require('../models/sensor');
const User = mongoose.model('UserSchema');
const Sensor = mongoose.model('SensorSchema');

exports.authorizeUser = async (req, res, next) => {
    const { user } = await User.authenticate()(req.body.user, req.body.password);
    // const user = await User.findOne({user: req.body.user});
    // console.log('user from authContr: '+ JSON.stringify(user)); //why
    // console.log('req.body: '+ JSON.stringify(req.body));
    var authBody = {user: req.body.user};
    var token = jwt.sign(authBody, process.env.SECRET);

    var userObj = user.toObject(); //err here..

    userObj.binMaster.authToken = token;
    res.status(200).json(userObj.binMaster);
    //should also have res.stastus(400) for failure adn handle it with the front end
}

exports.authorizeToken = async (req, res, next) => {//I would really like to authorize people here, then append the user to the req body
    const authToken = req.body.authToken;
    const authBody = jwt.verify(authToken, process.env.SECRET);
    req.authorizedUser = authBody.user;

    next();
}

exports.loginToken = async (req, res, next) => {
    var user = await User.findOne({user: req.authorizedUser});
    user = user.toObject();
    user.binMaster.user = req.authorizedUser;
    res.status(200).json(user.binMaster);
}

exports.loginTokenManageAlerts = async (req, res) => {
    var user = await User.findOne({user: req.authorizedUser});
    user = user.toObject();
    function linearizeBinMaster(cb){
        var counter = 0;
        for(let i=0; i<user.binMaster.bins.length; i++){
            for(let j=0; j<user.binMaster.bins[i].cables.length; j++){
                for(let k=0; k<user.binMaster.bins[i].cables[j].sensors.length; k++){
                    cb(i, j, k, counter);//gen array, use counter to find position in the array 
                    counter++;
                };
            };
        };
    }

    var promiseArray = [];
    linearizeBinMaster((bin, cable, sensor, counter) => {
        let id = user.binMaster.bins[bin].cables[cable].sensors[sensor];
        promiseArray.push(Sensor.findById(id));
    });
    var promiseResults = await Promise.all(promiseArray);
    linearizeBinMaster((bin, cable, sensor, counter) => {
        user.binMaster.bins[bin].cables[cable].sensors[sensor] = promiseResults[counter];
    });
    res.status(200).json(user.binMaster);
}