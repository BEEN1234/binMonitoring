const mongoose = require('mongoose');
const validator = require('validator');

require('../models/user');
require('../models/sensor');
User = mongoose.model('UserSchema');
Sensor = mongoose.model('SensorSchema');

require('passport-local');

exports.sanitizeEmail = (req, res, next) => {
  req.body.user = validator.trim(req.body.user);
  req.body.user = validator.normalizeEmail(req.body.user);
  next();
}

exports.validateRegister = async (req, res, next) => {
  function errorObjGen(originId, msg){
    this.originId = originId,
    this.msg = msg
  }
  req.myErrors = [];
  var skipBool = false;
  if(validator.isEmpty(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Please supply a phone number"));
  };
  if(!validator.isEmail(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Invalid phonenumber, this user may already exist"));
    skipBool = true;
  };

  if(validator.isEmpty(req.body.password)){
    req.myErrors.push(new errorObjGen("Password", "Please supply a password"));
  };

  if(!skipBool){ //how skip this for login auth? ultimately I just want to be sure it's not empty
    const user = await User.findOne({user: req.body.user}); //didnt' work
    if(user){
      req.myErrors.push(new errorObjGen("", "Invalid phonenumber, this user may already exist"));
    };
  }
  next();
}

exports.validateRegisterPhone = async (req, res, next) => {
  function errorObjGen(originId, msg){
    this.originId = originId,
    this.msg = msg
  }
  req.myErrors = [];
  var skipBool = false;
  if(validator.isEmpty(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Please supply a phone number"));
  };
  if(req.body.user.length !== 10 || !validator.isDecimal(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Invalid phonenumber, this user may already exist"));
    skipBool = true;
  };

  if(validator.isEmpty(req.body.password)){
    req.myErrors.push(new errorObjGen("Password", "Please supply a password"));
  };

  if(!skipBool){ //how skip this for login auth? ultimately I just want to be sure it's not empty
    const user = await User.findOne({user: req.body.user}); //didnt' work
    if(user){
      req.myErrors.push(new errorObjGen("", "Invalid phonenumber, this user may already exist"));
    };
  }
  next();
}

exports.validateLogin = async (req, res, next) => {
  if(validator.isEmpty(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Please supply an phonenumber"));
  };
  if(!validator.isEmail(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Invalid phonenumber"));
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

exports.validateLoginPhone = async (req, res, next) => {
  function errorObjGen(originId, msg){
    this.originId = originId,
    this.msg = msg
  }
  req.myErrors = [];
  if(validator.isEmpty(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Please supply a phone number"));
  };
  if(req.body.user.length !== 10 || !validator.isDecimal(req.body.user)){
    req.myErrors.push(new errorObjGen("user", "Invalid phonenumber"));
    skipBool = true;
  };
  if(validator.isEmpty(req.body.password)){
    req.myErrors.push(new errorObjGen("Password", "Please supply a password"));
  };
  next();
}

exports.registerUser = async (req, res, next) => {
  if(req.myErrors.length){
    return res.status(400).json({ errors: req.myErrors });
  }
  else{
    // console.log('at least within registerUser else');//delme
    const user = new User({user: req.body.user});//del me
    await user.setPassword(req.body.password);
    // console.log('user: '+ JSON.stringify(user));
    await user.save();
    next();
  };
}

exports.setupCable = async (req, res) => {
  const user = await User.findOneAndUpdate({user: req.authorizedUser}, {$pull: {'binMaster.vCables': {id: req.body.id}}});
  const sameUser = await User.findOne({user: req.authorizedUser});//this is all stupid

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

  var promiseArray = [];
  var sensors = req.body.bin.cables[0].sensors
  sensors.forEach((sensor) => {
    promiseArray.push(Sensor.findOneAndUpdate({id: sensor}, {owner: req.authorizedUser, muted: false}));
  });

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