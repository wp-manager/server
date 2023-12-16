import User from "../models/user";
import Site from "../models/site";
import { getUser } from "./auth";
import WordpressAPI from "../utils/wordpress";

const siteExists = async (req, res, next) => {
    let user = await getUser();

    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let site = await Site.findOne({
        uri,
        user,
    });

    if (!site) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    next();
};

const proxySite = async (req, res) => {
    let user = await getUser();

    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let site = await Site.findOne({
        uri,
        user,
    });

    if (!site) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    let proxyPath = req.params[0];

    let wpApi = new WordpressAPI(site.uri, site.auth);

    // include ?a params
    await wpApi.request(req.method, proxyPath, req.query, req.body)
    .then((response) => response.json())
    .then((data) => {
        res.json(data);
        return;
    }).catch((error) => {
        res.json({
            error: error.message,
        });
        return;
    });

    return;


    

    const url = new URL(`https://${uri}/wp-json/${proxyPath}`);
    // use query params from original request
    url.search = req.url.split("?")[1];

    await fetch(url.toString(), {
        headers: {
            Authorization: `Basic ${site.auth}`,
        },
    })
        .then((response) => response.json())
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            res.json({
                error,
            });
        });
};

export { proxySite, siteExists };
