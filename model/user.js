const mongoose = require('mongoose');

module.exports = (function() {
    const schema = new mongoose.Schema({
        openId: { type: String, required: true, unique: true },
        lastMo: { type: Date },
        consecutiveDays: { type: Number, required: true, default: 0 },
        totCnt: { type: Number, required: true, default: 0 }
    });

    return mongoose.connection.model("user", schema);
});

