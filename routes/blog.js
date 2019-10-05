const $express = require('express');
const { nextId, setField, validate } = require('./helper');

const blogItems = [
    {
        id: 1,
        title: 'Hello',
        content: 'Hello',
        author: 'Edgar',
        publishedAt: '05-09-2019' 
    }
];
const getNextId = nextId(blogItems);
const setTitle = setField(blogItems, 'title', validate('text'));
const setContent = setField(blogItems, 'content', validate('text'));
const setAuthor = setField(blogItems, 'author', validate('text'));
const setPublishedAt = setField(blogItems, 'publishedAt', validate('date'));

const router = $express.Router({
    caseSensitive: true,
    mergeParams: false,
    strict: true
});

const blogIdExists = async (blogId) => +blogId > 0 && blogItems.some(({ id }) => id === +blogId);

router.get('/', async (req, res) => {
    res.json({ data: blogItems });
});

router.post('/', async (req, res) => {
    const blogId = getNextId();
    blogItems.unshift({ id: blogId, title: '', content: '', author: '', publishedAt: '' });
    const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
    const { title, content, author, publishedAt } = req.body;
    setTitle(blogItemIndex, title);
    setContent(blogItemIndex, content);
    setAuthor(blogItemIndex, author);
    setPublishedAt(blogItemIndex, publishedAt);
    const blogItem = blogItems[blogItemIndex];
    res.json({ data: blogItem });        
});

router.get('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    if (blogIdExists(blogId)) {
        const blogItem = blogItems.find(({ id }) => id === +blogId);
        res.json({ data: blogItem });
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.put('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    if (blogIdExists(blogId)) {
        const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
        const { title, content, author, publishedAt } = req.body;
        setTitle(blogItemIndex, title);
        setContent(blogItemIndex, content);
        setAuthor(blogItemIndex, author);
        setPublishedAt(blogItemIndex, publishedAt);
        const blogItem = blogItems[blogItemIndex];
        res.json({ data: blogItem });
    } else {
        next(new Error('Error param: blogId'));
    }
});

router.delete('/:blogId', async (req, res, next) => {
    const blogId = +req.params.blogId;
    if (blogIdExists(blogId)) {
        const blogItemIndex = blogItems.findIndex(({ id }) => id === +blogId);
        const blogItem = blogItems.splice(blogItemIndex, 1).shift();
        res.json({ data: blogItem });
    } else {
        next(new Error('Error param: blogId'));
    }
});

module.exports = router;
