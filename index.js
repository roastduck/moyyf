const express = require('express');
const wechat = require('wechat');
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const config = require('./config.js');

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
    console.log('request: ' + JSON.stringify(req.query));
    next();
});
app.use(
    wechat({
        token: config.wechatToken,
        appid: config.wechatAppId,
        encodingAESKey: config.wechatAESKey
    }, wechat.text(function(message, req, res, next) {
        console.log("incoming: " + JSON.stringify(message));
        res.reply('receive: ' + message.Content);
    }))
);

/*
 * finally, go!
 */
app.listen(config.port);

