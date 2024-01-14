import express from "express";
const router = express.Router();

import accountRoutes from "./account";
import siteAuthRoutes from "./site-auth";
import siteRoutes from "./site";
import pluginRoutes from "./plugins";
import devRoutes from "./dev";


router.use("/account", accountRoutes);
router.use("/site-auth", siteAuthRoutes);
router.use("/site", siteRoutes);
router.use("/plugins", pluginRoutes);
router.use("/dev", devRoutes);


export default router;