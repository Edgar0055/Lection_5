/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */

module.exports.validate = ( type ) = (_) => {
    switch (type) {
    case 'email':
        return _ && /[\w\-\_\.]+[\@][\w\-\_\.]+/ig.test(_);
    case 'date':
        return _ && /[\d\.\/\-]{10,}/ig.test(_);
    case 'text':
        return _ && /[\w]{2,}/ig.test(_);
    default:
        return false;
    }
};

module.exports.bodySafe = ( body, keys ) => {
    keys = keys.split(' ');
    return Object.fromEntries(
        Object.entries( body )
            .filter( ( [ key ] ) => keys.includes( key ) )
    );
};
