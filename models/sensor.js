const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const SensorSchema = new mongoose.Schema({
    name: String, //user?
    id: String,
    reads: [{
        read: Number,
        time: {
            type: Date, 
            default: Date.now
        }
    }],
    alert: {
        type: Number,
        default: 30
    },
    owner: String,
    muted: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('SensorSchema', SensorSchema);