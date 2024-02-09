import Site from "../../../models/site";
import SiteAuth from "../../../models/site-auth";
import WPEngineUserSite from "../models/wp-engine-site";

const assignSite = async (req, res, next) => {
    let { installId, siteId, uri } = req.body;

    if(!installId || !siteId || !uri) {
        res.status(400).json({
            error: "Missing required fields",
        });
        return;
    }

    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(["https://", "http://"], "");

    const site = await Site.findOne({
        uri,
    });

    if (!site) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    // Check if the user has the sitge assigned
    let existingSite = await SiteAuth.findOne({
        user: req.user,
        site,
    });

    if(!existingSite) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }
    
    const existing = await WPEngineUserSite.findOne({
        user: req.user,
        site
    });

    if(existing){
        existing.siteId = siteId;
        existing.installId = installId;
        await existing.save();
    } else {
        let wpEngineUserSite = new WPEngineUserSite({
            user: req.user,
            site,
            siteId,
            installId,
        });
        await wpEngineUserSite.save();
    }   

    res.status(200).json({
        message: "Site assigned",
    });

};

// /assigned-site/:uri
const assignedSite = async (req, res) => {
    const { uri } = req.params;

    if(!uri) {
        res.status(400).json({
            error: "Missing required fields",
        });
        return;
    }

    let site = await Site.findOne({
        uri,
    });

    if (!site) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    let wpEngineUserSite = await WPEngineUserSite.findOne({
        user: req.user,
        site,
    });

    if(!wpEngineUserSite) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    res.status(200).json({
        siteId: wpEngineUserSite.siteId,
        installId: wpEngineUserSite.installId,
    });
}


export { assignSite, assignedSite };