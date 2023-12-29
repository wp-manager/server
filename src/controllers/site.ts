import User from "../models/user";
import Site from "../models/site";
import { getUser } from "./auth";
import WordpressAPI from "../utils/wordpress";
import WPEngineAPI from "../utils/wpengine";
import { WPEngineAuth } from "../models/wpengine";

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
    .then((response) => {
        if(response.ok){
            return response.json();
        }

        res.status(response.status);
        return response.json();
    })
    .then((data) => {
        res.json(data);
        return;
    }).catch((error) => {
        console.log(error);
        res.json({
            error: error.message,
        });
        return;
    });

    return;
};

const proxyWPE = async (req, res) => {
    let user = await getUser();

    let auth = await WPEngineAuth.findOne({
        user,
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
            console.log(error);
            res.json({
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
