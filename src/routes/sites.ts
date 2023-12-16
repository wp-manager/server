import express from "express";
import { getUserSites } from "../controllers/sites";
const router = express.Router();

router.all("/", getUserSites);


export default router;

