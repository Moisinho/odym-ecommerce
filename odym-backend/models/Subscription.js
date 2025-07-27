const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
