var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const BinMasterUserSchema = new mongoose.Schema({
    username: String,
    bins: [{
        bin: String,
        cables: [{
            cable: String,
            sensors: [String]
        }]
    }],
    sensors: [{
        sensor: String,
        bin: String,
        cable: String,
        mostRecent: {
            read: Number,
            time: {
                type: Date,
                default: Date.now()
            }
        },
        reads:[{
            read: Number,
            time: {
                type: Date,
                default: Date.now()
            }
        }]
    }]
})

module.exports = mongoose.model('BinMasterUserSchema', BinMasterUserSchema)