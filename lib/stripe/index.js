const process = require( 'process' );
const Stripe = require( 'stripe' );
const stripe = Stripe( process.env.STRIPE_PRIVATE_KEY );
const customers = stripe.customers;
const charges = stripe.charges;


module.exports.customerCreate = async ( email ) => {
    return await customers.create({ email, });
};

module.exports.sourceCreate = async ( customer, source ) => {
    return await customers.createSource( customer, { source, });
};

module.exports.customerPaymentCreate = async (
    customer,
    source,
    amount,
    currency,
    description = ''
) => {
    return await charges.create({ customer, source, amount, currency, description, });
};

module.exports.customerPaymentList = async ( customer ) => {
    return await charges.list({ customer, });
};
