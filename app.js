/* eslint-disable no-unused-vars */
require('dotenv').config();
const $express = require('express');
const $process = require('process');
const $pug = require('pug');
const $bodyParser = require('body-parser');
const $models = require('./models');

const app = $express();

app.use($bodyParser.urlencoded({ extended: false }));
app.use($bodyParser.json());
app.engine('pug', $pug.__express);

app.use('/api/v1/blog', require('./routes/blog'));
app.use('/api/v1/users', require('./routes/user'));
app.use(require('./routes/fe'));

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

(async () => {
    await $models.sequelize.authenticate();
    console.log('DB connection success!');
    const port = $process.env.PORT || 2000;
    app.listen(port, () => {
        console.log(`Web-server started on port ${port}`);
    });
})();
