const mongoose = require('mongoose');

module.exports = (function() {
    const schema = new mongoose.Schema({
        content: { type: String, required: true, unique: true },
        toWhom: { type: [{ whom: { type: String }, vote: { type: Number } }], required: true }
    });

    return mongoose.connection.model("mo", schema);
});

