/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Users, } = require('../dbms/sequelize/models');
const { isAuth } = require('../lib/passport');
const UsersService = require( '../services/users' );
const { customerPaymentTotal, customerPaymentCreate, } = require( '../lib/stripe' );
const { paymentEmail, proEmail, } = require( '../lib/sendgrid' );


const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});
const AMOUNT = 100;
const CURRENCY = 'usd';


router.get('/fees',
    isAuth(),
    asyncHandler( async ( req, res ) => {
        const user = req.user;
        if ( !user ) {
            throw new Error('User not found');
        } else if ( user.is_pro ) {
            res.send({ data: { amount: 0, } });
        } else if ( user.stripe_customer_id && user.stripe_card_id ) {
            const payed = ( await customerPaymentTotal( user.stripe_customer_id ) ) / 100;
            res.send({ data: { amount: AMOUNT - payed } });
        } else {
            res.send({ data: { amount: AMOUNT } });
        }
    } )
);

router.put('/fees',
    isAuth(),
    UsersService.validationOnFeesCharge(),
    asyncHandler( async ( req, res ) => {
        let user = req.user;
        let { amount, } = req.body;
        amount = +amount * 100;
        if ( !user ) {
            throw new Error('User not found');
        } else if ( !user.stripe_customer_id ) {
            throw new Error('User.stripe_customer_id not found');
        } else if ( !user.stripe_card_id ) {
            throw new Error('User.stripe_card_id not found');
        }
        const payment = await customerPaymentCreate(
            user.stripe_customer_id,
            user.stripe_card_id,
            amount,
            CURRENCY,
            `Payment of ${ user.email }`,
        );
        await paymentEmail( user.email, payment.receipt_url );
        if ( user.is_pro ) {
            res.send({ data: { amount: 0, user, } });
        } else {
            const payed = await customerPaymentTotal( user.stripe_customer_id );
            const needed = Math.max( AMOUNT * 100 - payed, 0 ) / 100;
            if ( needed > 0 ) {
                res.send({ data: { amount: needed, user, } });
            } else {
                user = await Users.findByPk( user.id );
                await user.update( { is_pro: true, } );
                user = user.toJSON();
                req.logIn( user, ( error ) => {
                    error ? next( error ) : res.send( { data: { amount: 0, user, } } );
                } );
                await proEmail( user.email );
            }
        }
    } )
);

module.exports = router;
