const $limiter = require('express-rate-limit');
const $redisStore = require('rate-limit-redis');
const { $redisClient, } = require('../redis');

const requestsLimiter = $limiter({
    store: new $redisStore({ client: $redisClient, }),
    windowMs: 60 * 1000,
    max: 200,
    message:
      "Too many requests",
});
const loginLimiter = $limiter({
  store: new $redisStore({ client: $redisClient, }),
  windowMs: 10 * 60 * 1000,
    max: 20,
    message:
      "Too many requests",
});

module.exports = {
    requestsLimiter,
    loginLimiter,
};