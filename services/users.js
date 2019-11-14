const { check, validationResult, } = require( 'express-validator' );
const { Users, Sequelize, } = require('../dbms/sequelize/models');


class UsersService {
    validationCheckOnEdit() {
        return [
            check( 'firstName' ).isLength( { min: 2, max: 20, } ),    
            check( 'lastName' ).isLength( { min: 2, max: 20, } ),    
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