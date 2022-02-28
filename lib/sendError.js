module.exports = function sendError(res, err, status, message) {
    res.status(status);
    res.send({
        status: 'error',
        message,
    });

    if (err) {
        throw err;
    }
}
