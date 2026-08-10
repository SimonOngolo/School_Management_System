const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'   
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    audience: {
        type: String, enum: ['students', 'teachers', 'all'],
        required: true
    },
    createAt: {
        type: Date,
        default: new Date()
    }
})
module.exports = mongoose.model('Notice', noticeSchema);