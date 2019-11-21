/* eslint-disable no-unused-vars */
const $express = require('express');
const asyncHandler = require('express-async-handler');
const { Users, } = require('../dbms/sequelize/models');
const { isAuth } = require('../lib/passport');
const UsersService = require( '../services/users' );
const { customerPaymentList, customerPaymentTotal, customerPaymentCreate, } = require( '../lib/stripe' );
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
        const userId = +req.user.id;
        let user = await Users.findByPk( userId );
        const { amount, } = req.body;
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
            +amount * 100,
            CURRENCY,
            `Payment of ${ user.email }`,
        );
        await paymentEmail( user.email, payment.receipt_url );
        let needed = 0;
        if ( !user.is_pro ) {
            const payed = await customerPaymentTotal( user.stripe_customer_id );
            needed = AMOUNT * 100 - payed;
            if ( needed <= 0 ) {
                await user.update( { is_pro: true, } );
                await proEmail( user.email );
            }
            needed = needed / 100;
        }
        res.send({ data: { amount: needed, user: user.toJSON(), } });
    } )
);

module.exports = router;
