const { body, } = require( 'express-validator' );
const { Comments, Users, Sequelize, } = require('../dbms/sequelize/models');
const { validation, } = require( '../lib/validation' );


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

    validateContent = body( 'content' )
        .isLength( { max: 200, } )
        .withMessage( 'Content too long' );

    validationOnComments() {
        return validation( [
            this.validateContent,
        ] );
    }

}

module.exports = new CommentsService();