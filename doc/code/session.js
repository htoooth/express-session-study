const onHeaders = require('on-headers');

function defineMethod(obj, name, fn) {
    Object.defineProperty(obj, name, {
        configurable: true,
        enumerable: false,
        value: fn,
        writable: true
    });
}

function createSession(req) {
    req.yohoSession = {};

    defineMethod(req.yohoSession, 'destory', function() {
        req.session.destory();
        req.session2.reset();
    });

    defineMethod(req.yohoSession, 'save', function() {
        Object.assign(req.session, req.yohoSession);
        Object.assign(req.session2, req.yohoSession);
    });

    defineMethod(req.yohoSession, 'load', function() {
        if (req.session) {
            req.memcachedSessionError = false;
            Object.assign(req.yohoSession, req.session);
        } else {
            req.memcachedSessionError = true;
            Object.assign(req.yohoSession, req.session2);
        }
    });
}

module.exports = (req, res, next) => {
    if (req.yohoSession) {
        return next();
    }

    createSession(req);

    onHeaders(res, function() {
        req.yohoSession.save();
    });

    req.yohoSession.load();
};

