import Site from "../models/site";

const getUserSites = async (req, res, next) => {

    let sites = await Site.find({
        user: req.user,
    }).select("-auth -user");

    res.json(sites);
}

export { getUserSites };
