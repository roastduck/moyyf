"use strict"

const shuffleArray = require('shuffle-array');

const model = {
    mo: require('./model/mo.js')(),
    users: require('./model/users.js')()
};

const help = "请输入'mo ' + 拼音首字母缩写，例如'mo yyf'";

module.exports = function(openId, text, callback) { /// @param callback : fn(err, reply)
    model.users.findOrCreate({ openId }, function(err, user){
        if (err) {
            callback(err);
            return;
        }

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

        const tryGotoChoose = function(whom, yesCnt, noCnt, notSureCnt, callback) { /// @param callback : fn(err, yes, no, notSure)
            model.mo.findRandom({ whom, vote: { $gte: 5 } }).limit(yesCnt).exec(function(err1, yes) {
                model.mo.findRandom({ whom, vote: { $lte: -2 } }).limit(noCnt).exec(function(err2, no) {
                    model.mo.findRandom({ whom, vote: { $gt: -2, $lt: 5 } }).limit(notSureCnt).exec(function(err3, notSure) {
                        callback(err1 || err2 || err3, yes, no, notSure);
                    });
                });
            });
        };

        const gotoChoose = function(whom, yes, no, notSure) {
            const options = yes.concat(no).concat(notSure);
            shuffleArray(options);
            const toLetter = (function(obj) {
                const ret = { obj, letter: String.fromCharCode("a".charCodeAt() + options.indexOf(obj)) };
                return ret;
            });
            yes = yes.map(toLetter);
            no = no.map(toLetter);
            notSure = notSure.map(toLetter);

            const reply = '请选出膜' + whom + '的若干项（输入字母）：\n' +
                          'a. ' + options[0].content + '\n' +
                          'b. ' + options[1].content + '\n' +
                          'c. ' + options[2].content + '\n' +
                          'd. ' + options[3].content;
            
            user.stat = 'choose';
            user.statParam = JSON.stringify({ whom, yes, no, notSure });
            user.save(function(err) {
                callback(err, reply);
            });
        };

        const startMo = function(whom) {
            if (Math.random() > 0.3)
                tryGotoChoose(whom, 2, 1, 1, function(err, yes, no, notSure) {
                    if (yes.length == 2 && no.length == 1 && notSure.length == 1)
                        gotoChoose(whom, yes, no, notSure);
                    else
                        tryGotoChoose(whom, 3, 0, 1, function(err, yes, no, notSure) {
                            if (yes.length == 3 && no.length == 0 && notSure.length == 1)
                                gotoChoose(whom, yes, no, notSure);
                            else
                                gotoSay(whom);
                        });
                });
            else
                gotoSay(whom);
        };

        const success = function(whom) {
            user.successMo(function(err) {
                if (err) {
                    callback(err);
                    return;
                }
                user.stat = 'index';
                user.save(function(err) {
                    callback(err, "成功膜" + whom + "，已连续膜了" + user.consecutiveDays + "天，一共膜了" + user.totCnt + "次");
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
                    case 'fmj':
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
                        success(user.statParam);
                });
                break;

            case 'choose':
                const param = JSON.parse(user.statParam);
                const input = text.split('');

                const wrong = function() {
                    user.stat = 'index';
                    user.save(function(err) {
                        callback(err, "回答错误");
                    });
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
                    model.mo.addWeight(param.notSure[i].obj.content, param.whom, (input.indexOf(param.notSure[i].letter) != -1) ? 1 : -1, function() {});

                success(param.whom);
                break;

            default:
                illeagle();
        }
    });
};

