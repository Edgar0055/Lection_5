const { body, } = require( 'express-validator' );
const { Users, Sequelize, } = require('../dbms/sequelize/models');
const { validation, } = require( '../lib/validation' );


class UsersService {

    validateEmail = body( 'email' )
        .isEmail()
        .withMessage( 'Email is incorrect' );
    
    validatePassword = body( 'password' )
        .isLength( { min: 6, max: 20, } )
        .withMessage( 'Password length must be in range [6, 20] chars' );

    validateFirstName = body( 'firstName' )
        .isLength( { min: 1, max: 20, } )
        .withMessage( 'First name length must be in range [1, 20] chars' );

    validateLastName = body( 'lastName' )
        .isLength( { min: 1, max: 20, } )
        .withMessage( 'Last name length must be in range [1, 20] chars' );

    validationOnRegistation() {
        return validation( [
            this.validateEmail,
            this.validatePassword,
            this.validateFirstName,
            this.validateLastName,
        ] );
    }

    validationOnLogin() {
        return validation( [
            this.validateEmail,
            this.validatePassword,
        ] );
    }

    validationOnEdit() {
        return validation( [
            this.validateFirstName,
            this.validateLastName,
        ] );
    }

}

module.exports = new UsersService();