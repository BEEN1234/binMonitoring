var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
require('../models/sensor');
require('../models/user');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');
var Sensor = mongoose.model('SensorSchema'); //problem at the red
var User = mongoose.model('UserSchema');

const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', async function(req, res) {
  res.render('homepage');
});

router.post('/register', userController.validateRegisterPhone, userController.registerUser, authController.authorizeUser);
// userController.sanitizeEmail, userController.validateRegister, userController.registerUser, authController.authorizeUser);
router.post('/login', userController.validateLoginPhone, authController.authorizeUser);
// userController.sanitizeEmail, userController.validateLogin, authController.authorizeUser);//buggy test
router.post('/autoLogin', authController.authorizeToken, authController.loginToken);
router.post('/sensors/autoLogin', authController.authorizeToken, authController.loginTokenManageAlerts);//

router.get('/store/populateStore', storeController.populateStore);
router.post('/user/setupCable', authController.authorizeToken, userController.setupCable);
router.post('/store/buy', authController.authorizeToken, storeController.buy);

router.post('/sensorReads', authController.authorizeToken, async (req, res) => {
  //how to be sure they are querying their own sensors... i can look up the user...
  //should find a way to actually check that sensors are owned by the user
  const user = await User.findOne({user: req.authorizedUser}); //not working?
  if(!user){
    res.status(400);
    return;
  }

  var sensorArray = req.body.sensorArray;
  const promiseArray = [];
  sensorArray.forEach((sensorId) => {
    promiseArray.push(Sensor.findById(sensorId));
  });
  sensorArray = await Promise.all(promiseArray);
  for (var i=0; i<sensorArray.length; i++) {
    sensorArray[i] = sensorArray[i].reads.pop();
  }
  res.status(200).send({sensorArray: sensorArray});
});

router.get('/sensors/alerts', async (req, res) => {
  res.render('manageAlerts.pug');
});

router.post('/sensors/alerts', authController.authorizeToken, async (req, res) => {
  const user = await User.findOne({user: req.authorizedUser});
  if(!user){
    res.status(400);
    return;
  }

  //i'll have to check if muted or alert is undefined...under body.settingAlert

  var promiseArray = [];
  req.body.data.forEach((sensor) => {
    if(req.body.settingAlert){
      promiseArray.push(Sensor.findByIdAndUpdate(sensor._id, {alert: sensor.alert}));
    }
    else{
      promiseArray.push(Sensor.findByIdAndUpdate(sensor._id, {muted: sensor.muted}));
    }
  });
  var promiseResults = await Promise.all(promiseArray);
  var toSend = {
    msg: "Sucessfully updated, refreshing"
  }
  res.send(toSend);
});

module.exports = router;