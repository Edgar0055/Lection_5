const parse = (data) => data.split('&')
    .map(_ => _.split('=', 2))
    .map(([key, value]) => ({ [decodeURIComponent(key)]: decodeURIComponent(value) }))
    .reduce((__, _) => Object.assign(__, _), {});

const load = (req) => new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => data+=chunk)
            .on('end', () => resolve(parse(data)))
            .on('error', reject);
    });

module.exports = { parse, load };