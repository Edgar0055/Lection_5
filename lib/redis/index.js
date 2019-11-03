const $process = require('process');
const $redis = require('redis');
const $redisClient = $redis.createClient( $process.env.REDIS_URL );
const $redisStore = require('connect-redis');

module.exports = {
    $redisClient,
    $redisStore,
};