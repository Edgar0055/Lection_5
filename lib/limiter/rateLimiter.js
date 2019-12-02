const { RateLimiterRedis } = require('rate-limiter-flexible');


const rateLimiter = client => {
    return new RateLimiterRedis( {
        redis: client,
        keyPrefix: 'socket:rl:',
        points: 100,
        duration: 1,
    } );
}

module.exports = rateLimiter;