import express from "express";
import { getAuthdUser, register, login, emailAvailability, logout } from "../controllers/auth";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/user", JWTUtils.authorisedUserMiddleware, getAuthdUser);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/email-availability", emailAvailability);

router.get("/cookie-test", (req, res) => {
    res.json({
        cookie: req.cookies,
        signedCookie: req.signedCookies,
    });
});


export default router;

