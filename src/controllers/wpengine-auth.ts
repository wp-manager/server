import { WPEngineAuth } from "../models/wpengine";

const handleWPEngineCredentials = async (req, res) => {
    if(!req.body.username || !req.body.password) {
        res.status(400).json({
            error: "Missing username and/or password",
        });
        return;
    }


    let wpeAuth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if(wpeAuth) {
        wpeAuth.auth = btoa(`${req.body.username}:${req.body.password}`);
        await wpeAuth.save();
        res.json({
            success: true,
            updated: true,
        });
        return;
    }

    
    wpeAuth = new WPEngineAuth({
        user: req.user,
        auth: btoa(`${req.body.username}:${req.body.password}`),
    });
    wpeAuth.save();
    req.user.wpengineAuth = wpeAuth;
    await req.user.save();

    res.json({
        success: true,
    });

    
};

export { handleWPEngineCredentials };
