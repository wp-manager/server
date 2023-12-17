import { WPEngineAuth, WPEngineSite } from "../models/wpengine";
import { getUser } from "./auth";

const handleWPEngineCredentials = async (req, res) => {
    let user = await getUser();

    if(!req.body.username || !req.body.password) {
        res.status(400).json({
            error: "Missing username and/or password",
        });
        return;
    }


    let wpeAuth = await WPEngineAuth.findOne({
        user,
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
        user,
        auth: btoa(`${req.body.username}:${req.body.password}`),
    });
    wpeAuth.save();
    user.wpengineAuth = wpeAuth;
    await user.save();

    res.json({
        success: true,
    });

    
};

export { handleWPEngineCredentials };
