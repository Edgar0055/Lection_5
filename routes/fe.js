const $express = require('express');
const $https = require('https');
const $process = require('process');

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('*', (req, res) => {
    $https.get($process.env.FRONTED_URL, response => response.pipe(res));
});

module.exports = router;
