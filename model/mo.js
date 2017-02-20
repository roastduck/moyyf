const mongoose = require('mongoose');

module.exports = (function() {
    const schema = new mongoose.Schema({
        content: { type: String, required: true, unique: true },
        toWhom: { type: [{ whom: { type: String }, vote: { type: Number } }], required: true }
    });
    schema.static({
        addWeight: function(content, whom, delta, callback) { /// @param callback : fn(err)
            const mo = this;
            mo.findOne({ content: content }, function(err, item) {
                if (err) {
                    callback(err);
                    return;
                }
                if (item === null)
                    mo.create({ content: content, toWhom: [{ whom: whom, vote: delta }] }, callback);
                else {
                    console.log('original content is' + JSON.stringify(item));
                    let obj = undefined;
                    while ((obj = item.toWhom.find(function(x) { return x.whom == whom; })) === undefined)
                        item.toWhom.push({ whom: whom, vote: 0 });
                    obj.vote += delta;
                    item.save(callback);
                }
            });
        }
    });

    return mongoose.connection.model("mo", schema);
});

