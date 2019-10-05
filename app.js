/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const $process = require('process');
const $pug = require('pug');
const $bodyParser = require('body-parser');

const app = $express();

app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());
app.engine('pug', $pug.__express);

app.use('/api/v1/blog', require('./routes/blog'));
app.use('/api/v1/users', require('./routes/user'));
app.use(require('./routes/fe'));

app.use($express.static('assets', {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['htm', 'html'],
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders: (res, path, stat) => {
        res.set('x-timestamp', Date.now())
    }
}));

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen($process.env.PORT || 2000);
