const process = require( 'process' );
const sg = require( '@sendgrid/mail' );

sg.setApiKey( process.env.SENDGRID_API_KEY );

module.exports.verifyEmail = ( email, token ) => sg.send( {
    to: email,
    from: 'edgar@zazmic.com',
    template_id: 'd-cb088862dad44b1cb7591609357e4767',
    dynamic_template_data: {
        url: `${ process.env.MY_FRONTEND_URL }/verify?token=${ token }`,
    },
} );