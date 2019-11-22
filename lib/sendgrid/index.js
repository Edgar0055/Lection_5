const process = require( 'process' );
const sg = require( '@sendgrid/mail' );

sg.setApiKey( process.env.SENDGRID_API_KEY );

const sendgridFrom = 'edgar@zazmic.com';
const sendgridTemplates = {
    verifyId: 'd-cb088862dad44b1cb7591609357e4767',
    paymentId: 'd-8bb1a9ab26d543a7bf49b118330a5f10',
    proId: 'd-93de3a0fdcd746ab85e5c06d492b40f6'
};

module.exports.verifyEmail = async ( email, token ) => sg.send( {
    to: email,
    from: sendgridFrom,
    template_id: sendgridTemplates.verifyId,
    dynamic_template_data: {
        url: `${ process.env.MY_FRONTEND_URL }/verify?token=${ token }`,
    },
} );

module.exports.paymentEmail = ( email, url ) => sg.send( {
    to: email,
    from: sendgridFrom,
    template_id: sendgridTemplates.paymentId,
    dynamic_template_data: {
        url,
    },
} );

module.exports.proEmail = ( email ) => sg.send( {
    to: email,
    from: sendgridFrom,
    template_id: sendgridTemplates.proId,
    dynamic_template_data: { },
} );