const mongoose = require('mongoose');
const validator = require('validator');

require('../models/user');
require('../models/sensor');
User = mongoose.model('UserSchema');
Sensor = mongoose.model('SensorSchema');

require('passport-local');

exports.sanitizeEmail = (req, res, next) => {
  req.body.email = validator.trim(req.body.email);
  req.body.email = validator.normalizeEmail(req.body.email);
  next();
}

exports.validateRegister = async (req, res, next) => {
  //help... errors - originId and msg
  function errorObjGen(originId, msg){
    this.originId = originId,
    this.msg = msg
  }
  req.myErrors = [];
  var skipBool = false;
  if(validator.isEmpty(req.body.email)){
    req.myErrors.push(new errorObjGen("Email", "Please supply an email"));
  };
  if(!validator.isEmail(req.body.email)){
    req.myErrors.push(new errorObjGen("Email", "Invalid email, this user may already exist"));
    skipBool = true;
  };

  if(validator.isEmpty(req.body.password)){
    req.myErrors.push(new errorObjGen("Password", "Please supply a password"));
  };

  if(!skipBool){ //how skip this for login auth? ultimately I just want to be sure it's not empty
    const user = await User.findOne({email: req.body.email}); //didnt' work
    if(user){
      req.myErrors.push(new errorObjGen("", "Invalid email, this user may already exist"));
    };
  }
  next();
}

exports.validateLogin = async (req, res, next) => {
  if(validator.isEmpty(req.body.email)){
    req.myErrors.push(new errorObjGen("Email", "Please supply an email"));
  };
  if(!validator.isEmail(req.body.email)){
    req.myErrors.push(new errorObjGen("Email", "Invalid email, this user may already exist"));
    skipBool = true;
  };
  if(validator.isEmpty(req.body.password)){
    req.myErrors.push(new errorObjGen("Password", "Please supply a password"));
  };
  if(req.myErrors){
    res.status(400).send("forbidden request");
  }
  else{
    next();
  }
}

exports.registerUser = async (req, res, next) => {
  //unaltered email in case
  if(req.myErrors.length){
    // console.log('found errors in register user');
    return res.status(400).json({ errors: req.myErrors });
  }
  else{
    // console.log('at least within registerUser else');//delme
    user = new User({email: req.body.email});//del me
    await user.setPassword(req.body.password);
    // console.log('user: '+ JSON.stringify(user));
    await user.save(); //with this commented out it works, but this causes dupe key error
    next();
  };
}

exports.setupCable = async (req, res) => {
  const user = await User.findOneAndUpdate({email: req.body.user}, {$pull: {'binMaster.vCables': {id: req.body.id}}});
  const sameUser = await User.findOne({email: req.authorizedUser});

  if(!validator.isAlphanumeric(req.body.bin.bin)){
    req.errors.push("Please only use letters and numbers");
  };
  if(!validator.isAlphanumeric(req.body.bin.cables[0].cable)){
    req.errors.push("Please only use letters and numbers");
  };

  var noError = true;
  for(let i; i<req.body.bin.cables[0].sensors; i++){
    if(!validator.isHexadecimal(req.body.bin.cables[0].sensors[i])){
      if(noError){
        req.errors.push("error");
        noError = false;
      }
    }
  };

  if(req.errors){
    res.status(400).send(req.errors);
    return;
  };

  //1. need to swap id array with _id under sensors
  //2. stamp the sensor with owner, muted, and alert temp

  //1
  var promiseArray = [];
  var sensors = req.body.bin.cables[0].sensors
  sensors.forEach((sensor) => {
    // console.log('sensor: '+ JSON.stringify(sensor)); //werks
    promiseArray.push(Sensor.findOne({id: sensor}));
  });
  // console.log('sensors: '+ JSON.stringify(sensors));//werks it's an array

  //delMe: 
    // const resAROO = await Sensor.findOne({id: sensors[0]});
    // console.log('resAROO: '+ JSON.stringify(resAROO));//werks

  const results = await Promise.all(promiseArray);
  const Sensor_ids = [];
  for(let i=0; i<results.length; i++){
    Sensor_ids.push(results[i]._id);
  };
  req.body.bin.cables[0].sensors = Sensor_ids;

  sameUser.binMaster.bins.push(req.body.bin);
  await sameUser.save();

  var sendObj = {
    msg: "success, bin added",
    sensors_ids: Sensor_ids
  };
  res.status(200).json(sendObj);
}