/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
module.exports.nextId = (items) => () => items.map(({ id }) => id)
    .concat(0)
    .sort((a, b) => b - a)
    .shift() + 1;

module.exports.setField = (items, field, validate = false) => (index, value) => {
    const item = items[index];
    if (!item) return false;
    if (validate instanceof Function && !validate(value)) return false;
    items[index] = { ...item, ...{ [field]: value } };
    return true;
};

module.exports.validate = (type) = (_) => {
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
