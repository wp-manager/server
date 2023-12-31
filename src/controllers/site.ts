import Site from "../models/site";
import WordpressAPI from "../utils/wordpress";
import WPEngineAPI from "../utils/wpengine";
import { WPEngineAuth } from "../models/wpengine";

const siteExists = async (req, res, next) => {
    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let site = await Site.findOne({
        uri,
        user: req.user,
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
    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let site = await Site.findOne({
        uri,
        user: req.user,
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
    .then(async (response) => {
        if(!response.ok){
            const body = await response.text();
            return res.status(response.status).send(body);
        }
        
        const body = await response.json();
        return res.status(response.status).json(body);

    }).catch((error) => {
        res.status(500).json({
            error: 'Failed to proxy request',
        });
        return;
    });

    return;
};

const proxyWPE = async (req, res) => {
    let auth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if (!auth) {
        res.status(404).json({
            error: "No WP Engine credentials found",
        });
        return;
    }

    let proxyPath = req.params[0];

    let wpeApi = new WPEngineAPI(auth.auth);

    // include ?a params
    await wpeApi.request(req.method, proxyPath, req.query, req.body)
    .then(async (response) => {
        let responseText = await response.text();

        if(responseText === "") {
            res.json({
                ok: true,
            });
            return;
        }

        let responseJson;

        try {
            responseJson = JSON.parse(responseText);
            if(responseJson.ok){
                res.json(responseJson);
                return;
            }
        } catch (error) {
            res.status(response.status).json({
                error: error.message,
            });
            return;
        }

        if(responseJson.ok){
            res.json(responseJson);
            return;
        }


        res.json(responseJson);
    });
    return;
};

export { proxySite, siteExists, proxyWPE };
