const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    method: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 20
    },
    endpoint: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 20
    },
    user: { // changed from 'userid' to 'user'
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 80
    },
    userip: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 80
    },
    response_code: { // changed from 'statusCode' to 'response_code'
        type: Number,
        required: true
    },
    timestamp: { // changed from 'date' to 'timestamp'
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('logger', schema);
