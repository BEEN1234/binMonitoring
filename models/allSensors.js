const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const allSensors =  new mongoose.Schema({
    binMaster: String, 
});

module.exports = mongoose.model('allSensorsSchema', allSensors);