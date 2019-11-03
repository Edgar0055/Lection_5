const isAuth = ( message = 'Auth error' ) => async ( req, res, next ) => {
    if (req.isAuthenticated()) {
        next( null, );
    } else {
        next(new Error( message ));
    }   
}

module.exports.isAuth = isAuth;