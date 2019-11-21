const process = require( 'process' );
const sg = require( '@sendgrid/mail' );

sg.setApiKey( process.env.SENDGRID_API_KEY );

module.exports.verifyEmail = async ( email, token ) => sg.send( {
    to: email,
    from: 'edgar@zazmic.com',
    template_id: 'd-cb088862dad44b1cb7591609357e4767',
    dynamic_template_data: {
        url: `${ process.env.MY_FRONTEND_URL }/verify?token=${ token }`,
    },
} );

module.exports.paymentEmail = ( email, url ) => sg.send( {
    to: email,
    from: 'edgar@zazmic.com',
    template_id: 'd-8bb1a9ab26d543a7bf49b118330a5f10',
    dynamic_template_data: {
        url,
    },
} );

module.exports.proEmail = ( email ) => sg.send( {
    to: email,
    from: 'edgar@zazmic.com',
    template_id: 'd-93de3a0fdcd746ab85e5c06d492b40f6',
    dynamic_template_data: { },
} );