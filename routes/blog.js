const $express = require('express');
const { load } = require('./helper');

const blogItems = [];
const getNextId = () => blogItems.map(({ id }) => id).concat(0).sort((a, b) => b - a).shift() + 1;
const setTitle = (blogItemIndex, title) => {
    if (!title) return false;
    blogItems[blogItemIndex] = { ...blogItems[blogItemIndex], title };
    return true;
};
const setContent = (blogItemIndex, content) => {
    if (!content) return false;
    blogItems[blogItemIndex] = { ...blogItems[blogItemIndex], content };
    return true;
};
const setAuthor = (blogItemIndex, author) => {
    if (!author) return false;
    blogItems[blogItemIndex] = { ...blogItems[blogItemIndex], author };
    return true;
};
const setPublishedAt = (blogItemIndex, publishedAt) => {
    if (!publishedAt) return false;
    blogItems[blogItemIndex] = { ...blogItems[blogItemIndex], publishedAt };
    return true;
};

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

router.get('/', async (req, res) => {
    res.status(200).type('application/json').end(JSON.stringify(blogItems));
});

router.post('/', async (req, res) => {
    const blogId = getNextId();
    blogItems.push({ id: blogId, title: '', content: '', author: '', publishedAt: '' });
    const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
    const { title, content, author, publishedAt } = await load(req);
    setTitle(blogItemIndex, title);
    setContent(blogItemIndex, content);
    setAuthor(blogItemIndex, author);
    setPublishedAt(blogItemIndex, publishedAt);
    const blogItem = blogItems[blogItemIndex];
    res.status(200).type('application/json').end(JSON.stringify(blogItem));        
});

router.param('blogId', async (req, res, next, blogId) => {
    if (+blogId > 0 && blogItems.some(({ id }) => id === +blogId)) {
        req.blogId = +blogId;
        next();
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.get('/:blodId', async (req, res) => {
    const blogId = req.blogId;
    const blogItem = blogItems.find(({ id }) => id === +blogId);
    res.status(200).type('application/json').end(JSON.stringify(blogItem));        
});

router.put('/:blogId', async (req, res) => {
    const blogId = req.blogId;
    const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
    const { title, content, author, publishedAt } = await load(req);
    setTitle(blogItemIndex, title);
    setContent(blogItemIndex, content);
    setAuthor(blogItemIndex, author);
    setPublishedAt(blogItemIndex, publishedAt);
    const blogItem = blogItems[blogItemIndex];
    res.status(200).type('application/json').end(JSON.stringify(blogItem));        
});

router.delete('/:blogId', async (req, res) => {
    const blogId = req.blogId;
    const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
    const blogItem = blogItems.splice(blogItemIndex, 1).shift();
    res.status(200).type('application/json').end(JSON.stringify(blogItem));        
});

module.exports = router;
