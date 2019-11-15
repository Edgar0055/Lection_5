const { check, validationResult, } = require( 'express-validator' );
const { Users, Sequelize, } = require('../dbms/sequelize/models');


class UsersService {
    validationCheckOnEdit() {
        return [
            check( 'firstName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("First name cannot be empty"),    
            check( 'lastName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("Last name cannot be empty"),  
        ];
    }

    async validationResultOnEdit( req ) {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            throw new Error( `my validation` );
        }
    }
}

module.exports = new UsersService();