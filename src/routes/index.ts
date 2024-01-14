import express from "express";
const router = express.Router();

import accountRoutes from "./account";
import siteAuthRoutes from "./site-auth";
import siteRoutes from "./site";
import pluginRoutes from "./plugins";


router.use("/account", accountRoutes);
router.use("/site-auth", siteAuthRoutes);
router.use("/site", siteRoutes);
router.use("/plugins", pluginRoutes);


export default router;