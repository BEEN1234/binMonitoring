const mongoose = require('mongoose');

const product = new mongoose.Schema({
    id: Number,
    class: {
        type: String, // like 30 foot cable, or 100 foot diy spool
        trim: true
    },
    stringOfSensors: Boolean, //would be "string" or "cable" weirdly enough
    sensors: [String]
})

module.exports = mongoose.model('Inventory', product);