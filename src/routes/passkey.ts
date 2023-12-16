import express from "express";
import { login, generatePasskeyRegistrationOptions, verifyPasskeyRegistrationResponse, generatePasskeyAuthenticationOptions, verifyPasskeyAuthenticationResponse } from "../controllers/passkey";
const router = express.Router();

router.get("/login", login);

router.get('/generate-registration-options', generatePasskeyRegistrationOptions)
router.post('/verify-registration-response', verifyPasskeyRegistrationResponse)

router.get('/generate-authentication-options', generatePasskeyAuthenticationOptions);
router.post('/verify-authentication-response', verifyPasskeyAuthenticationResponse);

export default router;

