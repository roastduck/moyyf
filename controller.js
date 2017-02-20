"use strict"

const shuffleArray = require('shuffle-array');

const model = {
    mo: require('./model/mo.js')(),
    users: require('./model/users.js')()
};

const help = "请输入'mo ' + 拼音首字母缩写，例如'mo yyf'";

module.exports = function(openId, text, callback) { /// @param callback : fn(err, reply)
    model.users.getUser(openId, function(err, user){
        if (err) {
            callback(err);
            return;
        }
        console.log(JSON.stringify(user));

        const illeagle = function() {
            user.stat = 'index';
            user.save(function(err) {
                callback(err, help);
            });
        };

        const gotoSay = function(whom) {
            user.stat = 'say';
            user.statParam = whom;
            user.save(function(err) {
                callback(err, '说一句膜' + whom + '的话');
            });
        };

        const tryGotoChoose = function(whom, callback) { /// @param callback : fn(err, yes, no, notSure)
            model.mo.findRandom({ vote: { $gte: 5 } }).limit(2).exec(function(err, yes) { // TODO: here is wrong
                if (err)
                    callback(err);
                else
                    model.mo.findRandom({ vote: { $lte: -5 } }).limit(1).exec(function(err, no) {
                        if (err)
                            callback(err);
                        else
                            model.mo.findRandom({ vote: { $gt: -5, $lt: 5 } }).limit(1).exec(function(err, notSure) {
                                callback(err, yes, no, notSure);
                            });
                    });
            });
        };

        const gotoChoose = function(whom, yes, no, notSure) {
            const options = yes.concat(no).concat(notSure);
            shuffleArray(options);
            const toLetter = (function(val) {
                val.letter = String.fromCharCode("a".charCodeAt() + options.indexOf(val));
                return val;
            });
            yes = yes.map(toLetter);
            no = no.map(toLetter);
            notSure = notSure.map(toLetter);

            const reply = '请选出膜' + whom + '的若干项（输入字母）：\n' +
                          'a. ' + options[0] + '\n' +
                          'b. ' + options[1] + '\n' +
                          'c. ' + options[2] + '\n' +
                          'd. ' + options[3];
            
            user.stat = 'choose';
            user.statParam = JSON.stringify({ whom, yes, no, notSure });
            user.save(function(err) {
                callback(err, reply);
            });
        };

        const startMo = function(whom) {
            if (Math.random() > 0.5)
                tryGotoChoose(whom, function(err, yes, no, notSure) {
                    if (yes.length == 2 && no.length == 1 && notSure.length == 1)
                        gotoChoose(whom, yes, no, notSure);
                    else {
                        console.log('no enough items');
                        gotoSay(whom);
                    }
                });
            else
                gotoSay(whom);
        };

        const success = function() {
            user.successMo(function(err) {
                if (err) {
                    callback(err);
                    return;
                }
                user.stat = 'index';
                user.save(function(err) {
                    callback(err, "成功膜" + user.statParam + "，已连续膜了" + user.consecutiveDays + "天，一共膜了" + user.totCnt + "次");
                });
            });
        }

        switch (user.stat) {
            case 'index':
                const parts = text.split(' ');
                if (parts.length != 2 || parts[0] != 'mo') {
                    illeagle();
                    break;
                }
                switch (parts[1]) {
                    case 'yyf':
                    case 'twd':
                    case 'fsy':
                    case 'czx':
                    case 'zty':
                    case 'wys':
                    case 'whz':
                        startMo(parts[1]);
                        break;
                    default:
                        illeagle();
                }
                break;

            case 'say':
                model.mo.addWeight(text, user.statParam, 1, function(err) {
                    if (err)
                        callback(err);
                    else
                        success();
                });
                break;

            case 'choose':
                console.log('param = ' + user.statParam);
                const param = JSON.parse(user.statParam);
                const input = text.split('');

                const wrong = function() {
                    callback(null, "回答错误");
                };

                for (let i in param.yes)
                    if (input.indexOf(param.yes[i].letter) == -1) {
                        wrong();
                        return;
                    }
                for (let i in param.no)
                    if (input.indexOf(param.no[i].letter) != -1) {
                        wrong();
                        return;
                    }
                for (let i in param.notSure)
                    if (input.indexOf(param.notSure[i].letter) != -1)
                        model.mo.addWeight(param.notSure[i].content, param.whom, 1, function() {});

                success();
                break;

            default:
                illeagle();
        }
    });
};

