/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Users, } = require('../dbms/sequelize/models');
const { isAuth } = require('../lib/passport');
const UsersService = require( '../services/users' );
const { customerPaymentList, customerPaymentCreate, } = require( '../lib/stripe' );
const { paymentEmail, proEmail, } = require( '../lib/sendgrid' );


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});


router.get('/fees',
    isAuth(),
    asyncHandler( async ( req, res ) => {
        const userId = +req.user.id;
        const user = await Users.findByPk( userId );
        let amount = 100; // dollars
        if ( !user ) {
            throw new Error('User not found');
        } else if ( user.is_pro ) {
            res.send({ data: { amount: 0, } });
        } else if ( user.stripe_customer_id && user.stripe_card_id ) {
            const payments = await customerPaymentList( user.stripe_customer_id );
            amount = amount * 100; // 100 * 100 cents
            for ( let payment of payments.data ) {
                amount -= +payment.amount;
            }
            amount = amount / 100; // dollars
            res.send({ data: { amount } });
        } else {
            res.send({ data: { amount } });
        }
    } )
);

router.put('/fees',
    isAuth(),
    // UsersService.validationCheckOnEdit(),
    asyncHandler( async ( req, res ) => {
        // await UsersService.validationResultOnEdit( req );
        const userId = +req.user.id;
        let { amount, } = req.body;
        amount = +amount; // dollars
        const currency = 'usd';
        const user = await Users.findByPk( userId );
        if ( !user ) {
            throw new Error('User not found');
        } else if ( !user.stripe_customer_id ) {
            throw new Error('User.stripeCustomerId not found');
        } else if ( !user.stripe_card_id ) {
            throw new Error('User.stripeCardId not found');
        }
        amount = amount * 100; // cents
        const payment = await customerPaymentCreate(
            user.stripe_customer_id,
            user.stripe_card_id,
            amount,
            currency,
            `Payment of ${ user.email }`
        );
        await paymentEmail( user.email, payment.receipt_url ); // TODO: send payment
        amount = 100; // dollars
        if ( user.is_pro ) {
            amount = 0;
        } else {
            amount = amount * 100; // cents
            const payments = await customerPaymentList( user.stripe_customer_id );
            for ( let payment of payments.data ) {
                amount -= +payment.amount;
            }
            if ( amount <= 0 ) {
                await user.update( { is_pro: true, } );
                await proEmail( user.email );
            }
            amount = amount / 100; // dollars
        }
        res.send({ data: { amount, user: user.toJSON(), } });
    } )
);

module.exports = router;
