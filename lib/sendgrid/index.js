const process = require( 'process' );
const sg = require( '@sendgrid/mail' );

sg.setApiKey( process.env.SENDGRID_API_KEY );

module.exports.verifyEmail = async ( email, token ) => sg.send( {
    to: email,
    from: process.env.SENDGRID_FROM,
    template_id: process.env.SENDGRID_VERIFY_ID,
    dynamic_template_data: {
        url: `${ process.env.MY_FRONTEND_URL }/verify?token=${ token }`,
    },
} );

module.exports.paymentEmail = ( email, url ) => sg.send( {
    to: email,
    from: process.env.SENDGRID_FROM,
    template_id: process.env.SENDGRID_PAYMENT_ID,
    dynamic_template_data: {
        url,
    },
} );

module.exports.proEmail = ( email ) => sg.send( {
    to: email,
    from: process.env.SENDGRID_FROM,
    template_id: process.env.SENDGRID_PRO_ID,
    dynamic_template_data: { },
} );