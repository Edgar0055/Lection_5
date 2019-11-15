const { check, validationResult, } = require( 'express-validator' );


class AuthService {
    validationCheckOnRegistation() {
        return [
            check( 'firstName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("First name cannot be empty"),    
            check( 'lastName' )
                .isLength( { min: 1, max: 20, } )
                .withMessage("Last name cannot be empty"),
            this.validationCheckOnLogin(),   
        ];
    }

    validationCheckOnLogin() {
        return [
            check( 'email' )
                .isEmail()
                .withMessage("Email is incorrect"),
            check( 'password' )
                .isLength( { min: 6, max: 20, } )
                .withMessage("Password must be at least 6 characters"),
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
}

module.exports = new AuthService();