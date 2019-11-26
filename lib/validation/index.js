const { validationResult, } = require( 'express-validator' );

module.exports.validation = ( rules ) => [
    ...rules,
    ( req, res, next ) => {
      const errors = validationResult( req );
      if ( !errors.isEmpty() ) {
        return res.status( 422 ).send( { errors: errors.array(), } );
      }
      next();
    }
];
