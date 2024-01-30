import express from "express";
import { getAccount, register, login, emailAvailability, logout } from "../controllers/auth";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/", JWTUtils.authorisedUserMiddleware, getAccount);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/email-availability", emailAvailability);

router.post("/install-plugin", JWTUtils.authorisedUserMiddleware, async (req: any, res) => {
    const { path } = req.body;

    const user = req.user;

    if(!path) {
        return res.status(400).json({
            error: "Missing path",
        });
    }

    user.plugins.push({ path });
    await user.save();

    res.json({
        message: "Plugin installed",
    });
});

router.post("/uninstall-plugin", JWTUtils.authorisedUserMiddleware, async (req: any, res) => {
    const { path } = req.body;

    const user = req.user;

    if(!path) {
        return res.status(400).json({
            error: "Missing path",
        });
    }

    user.plugins = user.plugins.filter((plugin) => {
        return plugin.path !== path;
    });

    await user.save();

    res.json({
        message: "Plugin uninstalled",
    });
});

router.get('/plugin/:cdnurl', async (req: any, res) => {
    const { cdnurl } = req.params;

    // decode the url if it's encoded
    const decoded = decodeURIComponent(cdnurl);

    // if token is in the decoded url, then it's a private plugin  
    // Take the token out of the url, and use it as a bearer token
    const url = new URL(decoded);
    const token = url.searchParams.get('token');

    if(token) {
        const response = await fetch(decoded, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if(!response.ok) {
            return res.status(404).json({
                error: "Plugin not found",
            });
        }

        res.setHeader('Content-Type', 'application/javascript');
        res.send(await response.text());
        return;
    }
});

export default router;