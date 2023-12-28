import express from "express";
const router = express.Router();

import authRoutes from "./auth";
import siteAuthRoutes from "./site-auth";
import siteRoutes from "./site";
import sitesRoutes from "./sites";
import wpengineRoutes from "./wpengine";
import pluginRoutes from "./plugins";


router.use("/auth", authRoutes);
router.use("/site-auth", siteAuthRoutes);
router.use("/site", siteRoutes);
router.use("/sites", sitesRoutes);
router.use("/wpengine", wpengineRoutes);
router.use("/plugins", pluginRoutes);


export default router;