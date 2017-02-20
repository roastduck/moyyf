const mongoose = require('mongoose');

module.exports = (function() {
    const schema = new mongoose.Schema({
        openId: { type: String, required: true, unique: true },
        lastMo: { type: Date },
        consecutiveDays: { type: Number, required: true, default: 0 },
        totCnt: { type: Number, required: true, default: 0 },
        stat: { type: String, required: true, default: 'index' },
        /**
         * stat:
         * index ------> say(whom)
         */
        statParam: { type: String }
    });
    schema.method({
        successMo: function(callback) { // @param callback: fn(err)
            const isConsecutive = function(a, b) {
                if (!a || !b) return false;
                a.setDate(a.getDate() + 1);
                return a.getYear() == b.getYear() && a.getMonth() == b.getMonth() && a.getDate == b.getDate();
            };

            if (isConsecutive(this.lastMo, new Date()))
                this.consecutiveDays ++;
            else
                this.consecutiveDays = 1;
            this.lastMo = new Date();
            this.totCnt ++;
            this.save(callback);
        }
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

