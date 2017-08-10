const config = global.config;
const session = require('express-session');

/**
 * 该中间件主要把 express-session 和 client-session 集中起来处理，如果 memcached 出错了，使用 cookie session
 * @param backSession cookeSession 的键名
 * @returns {function(*=, *=, *)}
 */
module.exports = (backSession) => {
    return (req, res, next) => {
        let notUseMemcached = _.get(req.app.locals.pc, 'session.removeMemcached', false);

        if (req.session && !notUseMemcached) {
            req.memcachedSessionError = false;
        } else {
            // 重建 session
            res.emit('sessionError');
            req.memcachedSessionError = true;
            req.session = new session.Session(req);
            req.session.cookie = new session.Cookie({
                domain: config.cookieDomain,
                httpOnly: false
            });

            req.session = Object.assign(req.session, req[backSession].sessionBack);
        }

        Object.defineProperty(req.session, 'reset', {
            configurable: true,
            enumerable: false,
            value: function() {
                req.session = null;
                req[backSession].reset();
            },
            writable: false
        });

        // 备份数据
        req[backSession].sessionBack = req.session;

        next();
    };
};