const express = require('express');
const wechat = require('wechat');
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const config = require('./config.js');
const controller = require('./controller.js');

/*
 * connect to db
 */
mongoose.connect(config.dbUrl);
mongoose.connection.on("error", function() {
    console.log("[ERROR] Failed to connect to db " + config.dbUrl);
    process.exit();
});
mongoose.connection.once("open", function() {
    console.log("Connected to db " + config.dbUrl);
});

/*
 * app
 */
const app = express();
app.use(express.query());
app.use(function(req, res, next) {
    next();
});
app.use(
    wechat({
        token: config.wechatToken,
        appid: config.wechatAppId,
        encodingAESKey: config.wechatAESKey
    }, wechat.text(function(message, req, res, next) {
        controller(message.FromUserName, message.Content, function(err, reply) {
            if (err)
                next(err);
            else
                res.reply(reply);
        });
    }))
);

/*
 * finally, go!
 */
app.listen(config.port);

