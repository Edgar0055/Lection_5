const $bcrypt = require('bcryptjs');
const { Users, OAuth_Account, } = require('../../dbms/sequelize/models');

const providerLogin = async (req, accessToken, refreshToken, profile, next) => {
    try {
        const {
            id: providerUserId,
            name: {
                givenName: firstName,
                familyName: lastName,
            },
            emails,
            provider,
        } = profile;
        const email = emails.map( _ => _.value ).shift();
        const password = '';
    
        let [ oauth, oauth_created ] = await OAuth_Account.findOrCreate({
            where: { provider, providerUserId, },
            defaults: { userId: null, }
        });
    
        const where = ( !oauth_created && oauth.userId > 0 ) ? { id: oauth.userId } : { email };
        let [ user, user_created ] = await Users.findOrCreate({
            where,
            defaults: { firstName, lastName, password, }
        });
        user = user.toJSON();
    
        if ( user_created || oauth.userId === null ) {
            oauth.userId = user.id;
            await oauth.save();
        }            
    
        next(null, user);   
    } catch ( error ) {
        next( error );
    }
};

module.exports = { providerLogin, };