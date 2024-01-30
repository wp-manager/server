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

export default router;

