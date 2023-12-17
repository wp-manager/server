import express from "express";
import { proxySite, siteExists } from "../controllers/site";
const router = express.Router();

router.all("/:uri/wp-json/*", siteExists, proxySite);

export default router;

