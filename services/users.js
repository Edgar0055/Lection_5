const { check, validationResult, } = require( 'express-validator' );
const { Users, Sequelize, } = require('../dbms/sequelize/models');


class UsersService {
    validationCheckOnRegistation() {
        return [
            ...this.validationCheckOnLogin(),
            ...this.validationCheckOnEdit(),  
        ];
    }

    validationCheckOnLogin() {
        return [
            check( 'email' )
                .isEmail()
                .withMessage("Email is incorrect"),
            check( 'password' )
                .isLength( { min: 6, max: 20, } )
                .withMessage("Password length must be in range [6, 20] chars"),
        ];
    }

    validationCheckOnEdit() {
        return [
            check( 'firstName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("First name length must be in range [1, 20] chars"),
            check( 'lastName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("Last name length must be in range [1, 20] chars"),
        ];
    }

    async validationResultOnRegistration( req ) {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            throw new Error( `my validation` );
        }
    }

    async validationResultOnLogin( req ) {
        return await this.validationResultOnRegistration( req );
    }

    async validationResultOnEdit( req ) {
        return await this.validationResultOnRegistration( req );
    }

}

module.exports = new UsersService();