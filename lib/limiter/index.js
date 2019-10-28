const $limiter = require('express-rate-limit');
const requestsLimiter = $limiter({
    windowMs: 60 * 1000,
    max: 200,
    message:
      "Too many requests",
});
const loginLimiter = $limiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message:
      "Too many requests",
});

module.exports = {
    requestsLimiter,
    loginLimiter,
};