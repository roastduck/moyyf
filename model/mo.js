"use strict"

const mongoose = require('mongoose');
const mongooseRandom = require('mongoose-random');
const findOrCreate = require('mongoose-find-or-create');

module.exports = (function() {
    const schema = new mongoose.Schema({
        content: { type: String, required: true, index: true },
        whom: { type: String, required: true },
        vote: { type: Number, required: true, index:true, default: 0 }
    });
    schema.index({ content: "text", whom: "text" }, { unique: true });
    schema.plugin(mongooseRandom);
    schema.plugin(findOrCreate);
    schema.static({
        addWeight: function(content, whom, delta, callback) { /// @param callback : fn(err)
            this.findOrCreate({ content, whom }, function(err, item) {
                if (err) {
                    callback(err);
                    return;
                }
                item.vote += delta;
                item.save(callback);
            });
        }
    });

    return mongoose.connection.model("mo", schema);
});

