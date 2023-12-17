import express from "express";
import { proxyWPE } from "../controllers/site";
const router = express.Router();

router.all("/*", proxyWPE);

export default router;

