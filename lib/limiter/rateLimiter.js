const { RateLimiterRedis } = require('rate-limiter-flexible');


const rateLimiter = client => {
    return new RateLimiterRedis( {
        redis: client,
        keyPrefix: 'socket:rl:',
        points: 3,
        duration: 30,
    } );
}

module.exports = rateLimiter;