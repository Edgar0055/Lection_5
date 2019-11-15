const { check, validationResult, } = require( 'express-validator' );
const { Comments, Users, Sequelize, } = require('../dbms/sequelize/models');


class CommentsService {
    async getComments( options ) {
        const { after, articleId, } = options, where = {};
        if ( articleId ) {
            Object.assign( where, { articleId, } );
        }
        if ( after ) {
            const id = after;
            Object.assign( where, {
                id: { [ Sequelize.Op.lt ]: +id },
            } );
        }

        let { limit, } = options;
        if ( !limit ) {
            limit = 5;
        }

        const comments = await Comments.findAll({
            where,
            include: [
                { model: Users.scope('comment'), as: 'author', },
            ],
            order: [ ['id', 'DESC'] ],
            limit,
        } );

        return comments;
    }

    validationCheckOnComments() {
        return [
            check( 'content' )
                .isLength( { max: 200, } )
                .withMessage("Content too long"),  
        ];
    }

    async validationResultOnComments( req ) {
        const errors = validationResult( req );
        if ( !errors.isEmpty() ) {
            throw new Error( `my validation` );
        }
    }
}

module.exports = new CommentsService();