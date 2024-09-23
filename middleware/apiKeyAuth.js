const apiKeyAuth = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ message: 'Ngapain masuk sini? ini punya kelompok 81!' });
    }
    next();
};

module.exports = apiKeyAuth;