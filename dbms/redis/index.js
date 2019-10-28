const $process = require('process');
const $ioredis = require('ioredis');
const redis = new $ioredis($process.env.REDIS_URL);

redis.on('error', (error) => {
    console.log(error);
});

module.exports = redis;