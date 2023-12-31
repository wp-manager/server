import { Request, Router } from "express";
import User from "../models/user";
import { getAuthdUser, getUser } from "./auth";
import Site from "../models/site";

const authSite = async (req: Request, res) => {
    let uri = req.params.uri;

    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    const url = new URL(`https://${uri}/wp-admin/authorize-application.php`);
    url.searchParams.append("app_name", "Site Manager");
    url.searchParams.append("app_id", "6708b25c-f31a-4a99-8dc5-68d575514c08");
    url.searchParams.append(
        "success_url",
        `${req.protocol}://${req.hostname}/site-auth/callback`
    );

    url.searchParams.append(
        "reject_url",
        `${req.protocol}://${req.hostname}/site-auth/callback`
    );

    const destination = url.toString();

    res.redirect(destination);
};

const handleAuthCallback = async (req, res) => {
    const user_login = req.query.user_login;

    let site_url = req.query.site_url;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    site_url = site_url.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let password = req.query.password;
    password = password.replace(/ /g, "");

    let auth = btoa(`${user_login}:${password}`);

    // Check if site already exists
    let site = await Site.findOne({
        uri: site_url,
        user: req.user,
    });

    let existing = false;

    if (site) {
        existing = true;
        site.auth = auth;
        site.save();
    } else {
        site = new Site({
            uri: site_url,
            user: req.user,
            auth,
        });
        site.save();

        req.user.sites.push(site);
        req.user.save();
    }

    res.redirect(`https://wp-manager.co.uk/sites/${site_url}`);
};

export { authSite, handleAuthCallback };
