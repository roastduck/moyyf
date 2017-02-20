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

        const startMo = function(whom) {
            gotoSay(whom);
        };

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
                        startMo(parts[1]);
                        break;
                    default:
                        illeagle();
                }
                break;
            case 'say':
                model.mo.addWeight(text, user.statParam, 1, function(err) {
                    if (err) {
                        callback(err);
                        return;
                    }
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
                });
                break;
            default:
                illeagle();
        }
    });
};

