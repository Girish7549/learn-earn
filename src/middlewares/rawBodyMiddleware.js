// Use only for webhook route before bodyParser
module.exports = function (req, res, next) {
    let data = [];
    req.on("data", chunk => {
        data.push(chunk);
    });
    req.on("end", () => {
        req.rawBody = Buffer.concat(data).toString();
        next();
    });
};
