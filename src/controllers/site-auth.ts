import { Request, Router } from "express";
import User from "../models/user";
import { getAuthdUser } from "./auth";
import Site from "../models/site";
import JWTUtils from "../utils/jwt";

const authSite = async (req: Request, res) => {
    let uri = req.params.uri;

    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(/(https?:\/\/)?(www\.)?/g, "").split("/")[0];

    let port = '';
    if (process.env.SERVER_PORT) {
        port = `:${process.env.SERVER_PORT}`;
    }

    const url = new URL(`https://${uri}/wp-admin/authorize-application.php`);
    url.searchParams.append("app_name", "Site Manager");
    url.searchParams.append("app_id", "6708b25c-f31a-4a99-8dc5-68d575514c08");
    url.searchParams.append(
        "success_url",
        `${req.protocol}://${req.hostname}${port}/site-auth/callback?token=${req.cookies.token}`
    );

    url.searchParams.append(
        "reject_url",
        `${req.protocol}://${req.hostname}/site-auth/callback`
    );

    const destination = url.toString();

    res.json({
        destination,
    });
    //res.redirect(destination);
};

const handleAuthCallback = async (req, res) => {
    // Since the callback comes from an external site, we can't use the cookie to verify the user
    // To get around this, we use a JWT token as a query parameter of the auth callback 
    const token = req.query.token;

    const user = await JWTUtils.authorisedUser(token);

    if(!user){
        res.status(401).json({
            message: "Not authorised",
        });
        return;
    }
    
    // Parse callback query params
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
        user
    });

    // If the site exists, update the auth
    if (site) {
        site.auth = auth;
        site.save();
    } else {
        site = new Site({
            uri: site_url,
            user,
            auth,
        });
        site.save();

        req.user.sites.push(site);
        req.user.save();
    }

    res.redirect(`${process.env.CLIENT_URL}/sites/${site_url}`);
};

export { authSite, handleAuthCallback };
