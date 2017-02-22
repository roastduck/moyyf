"use strict"

const mongoose = require('mongoose');
const findOrCreate = require('mongoose-find-or-create');

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
         *          |
         *          ---> choose(JSON(whom, yes, no, notSure))
         */
        statParam: { type: String }
    });
    schema.method({
        successMo: function(callback) { // @param callback: fn(err)
            const isSameDay = function(a, b) {
                if (!a || !b) return false;
                return a.getYear() == b.getYear() && a.getMonth() == b.getMonth() && a.getDate() == b.getDate();
            }
            const isConsecutive = function(a, b) {
                if (!a || !b) return false;
                a.setDate(a.getDate() + 1);
                return isSameDay(a, b);
            };

            if (isConsecutive(this.lastMo, new Date()))
                this.consecutiveDays ++;
            else if (! isSameDay(this.lastMo, new Date()))
                this.consecutiveDays = 1;
            this.lastMo = new Date();
            this.totCnt ++;
            this.save(callback);
        }
    });
    schema.plugin(findOrCreate);

    return mongoose.connection.model("users", schema);
});

