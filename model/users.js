const mongoose = require('mongoose');

module.exports = (function() {
    const schema = new mongoose.Schema({
        openId: { type: String, required: true, unique: true },
        lastMo: { type: Date },
        consecutiveDays: { type: Number, required: true, default: 0 },
        totCnt: { type: Number, required: true, default: 0 },
        stat: { type: String, required: true, default: 'index' }
        /**
         * stat:
         * index ------> say
         */
    });
    schema.static({
        getUser: function(openId, callback) { /// @param callback: fn(err, user)
            const users = this;
            users.findOne({ openId: openId }, function(err, user) {
                if (err) {
                    callback(err);
                    return;
                }
                if (user === null)
                    users.create({ openId: openId }, function(err, user) {
                        if (err)
                            callback(err);
                        else
                            callback(null, user);
                    });
                else
                    callback(null, user);
            });
        }
    });

    return mongoose.connection.model("users", schema);
});

