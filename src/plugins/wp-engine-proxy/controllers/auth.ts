import WPEngineAuth from "../models/wp-engine-auth";

const hasToken = async (req, res, next) => {
    const auth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if (!auth) {
        return res.status(401).json({
            message: "No token found",
        });
    }

    return res.status(200).json({
        message: "Token found",
    });
};

const deleteToken = async (req, res) => {
    const auth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if (!auth) {
        return res.status(401).json({
            message: "No token found",
        });
    }

    await auth.deleteOne();

    return res.status(200).json({
        message: "Token deleted",
    });
};

const updateToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({
            message: "Please enter a token",
        });
    }

    const existingAuth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if (!existingAuth) {
        const newAuth = new WPEngineAuth({
            user: req.user,
            auth: token,
        });
        await newAuth.save();
        return res.json({
            message: "Token added successfully",
        });
    }

    existingAuth.auth = token;
    await existingAuth.save();

    return res.json({
        message: "Token updated successfully",
    });
};

export { hasToken, updateToken, deleteToken };