import express from "express";
import { getAccount, register, login, emailAvailability, logout } from "../controllers/auth";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/", JWTUtils.authorisedUserMiddleware, getAccount);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/email-availability", emailAvailability);

export default router;

