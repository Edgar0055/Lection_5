const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Blog API',
        version: '1.0.0',
        description: 'Description example',
        termsOfService: 'http://exapmle.com/terms/',
        constact: {
            name: 'API Support',
            url: 'http://www.example.com/support/',
            email: 'supper@examle.com',
        },
        license: {
            name: 'Apache 2.0',
            url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
        },
    },
    basePath: '/',
    components: {},
    security: [],
};
const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none; }',
    swaggerOptions: {
        filter: true,
        requestInterceptor: ( req ) => {
            const regex = /XSRF-TOKEN=(.[^;]*)/ig;
            const match = regex.exec( document.cookie );
            req.headers[ 'x-csrf-token' ] = match[1];
            return req;
        },
    },
};

// const express = require('express');
// const router = express.Router();
// router.use(
module.exports = ( app ) => app.use(
    '/docs',
    ( req, res, next ) => {
        try {
            req.swaggerDoc = swaggerJsDoc( {
                swaggerDefinition,
                apis: [
                    `${ __dirname }/components/**/*.yaml`,
                    `${ __dirname }/paths/**/*.yaml`,
                ]
            } );
            next();    
        } catch ( error ) {
            console.log( error );
            next( error );
        }
    },
    swaggerUi.serve,
    swaggerUi.setup( null, swaggerUiOptions ),
);

// module.exports = router;