const mongoose = require('mongoose');

const catalogue = new mongoose.Schema({
    products: [{
        title: {
            type: String,
            trim: true
        },
        class: {
            type: String,
            trim: true,
            unique: true
        },
        description: String
    }]
});

module.exports = mongoose.model('Catalogue', catalogue);