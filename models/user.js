var mongoose = require('mongoose');
mongoose.Promise = global.Promise
const validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid Email'],
        required: 'Please supply an Email'
    },
    binMaster: {
        bins: [{
            bin: String,
            cables: [{
                cable: String,
                sensors: [String] //this should be the sensors objectID
            }]
        }],//
        vCables: [{
            id: Number,
            class: {
                type: String, // like 30 foot cable, or 100 foot diy spool
                trim: true
            },
            stringOfSensors: Boolean, //would be "string" or "cable" weirdly enough
            sensors: [String]
        }],
        ownedCables: [{
            id: Number,
            class: {
                type: String, // like 30 foot cable, or 100 foot diy spool
                trim: true
            },
            stringOfSensors: Boolean, //would be "string" or "cable" weirdly enough
            sensors: [String]
        }]
    }
}); // I was pushing in an object that also had such and such

UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
module.exports=mongoose.model('UserSchema', UserSchema);

//binMaster will be an array of id's each containing an array of timestamped reads, a cabe, and bin