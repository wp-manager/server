import { Request } from "express";
import Site from "../models/site";
import JWTUtils from "../utils/jwt";
import SiteAuth from "../models/site-auth";

const authSite = async (req: Request, res) => {
    let uri = req.params.uri;

    // replace http://, https://
    uri = uri.replace('https://', '').replace('http://', '');

    let port = "";
    if (process.env.SERVER_PORT) {
        port = `:${process.env.SERVER_PORT}`;
    }

    const url = new URL(`https://${uri}/wp-admin/authorize-application.php`);
    url.searchParams.append("app_name", "WP Manager");
    url.searchParams.append("app_id", "6708b25c-f31a-4a99-8dc5-68d575514c08");
    url.searchParams.append(
        "success_url",
        `${process.env.SERVER_URL}/site-auth/callback?token=${req.cookies.token}`
    );

    url.searchParams.append(
        "reject_url",
        `${process.env.SERVER_URL}/site-auth/callback`
    );

    const destination = url.toString();

    res.redirect(destination);
};

const handleAuthCallback = async (req, res) => {
    // Since the callback comes from an external site, we can't use the cookie to verify the user
    // To get around this, we use a JWT token as a query parameter of the auth callback
    const token = req.query.token;

    const user = await JWTUtils.authorisedUser(token);

    if (!user) {
        res.status(401).json({
            message: "Not authorised",
        });
        return;
    }

    // Parse callback query params
    const user_login = req.query.user_login;

    let site_url = req.query.site_url;
    // replace http://, https://
    site_url = site_url.replace('https://', '').replace('http://', '');

    let password = req.query.password;
    password = password.replace(/ /g, "");

    let auth = btoa(`${user_login}:${password}`);

    // Check if site already exists
    let site = await Site.findOne({
        uri: site_url,
    });

    if (!site) {
        site = new Site({
            uri: site_url,
        });
        await site.save();
    }

    // Check to see if the user has an auth against the site
    let existingAuth = await SiteAuth.findOne({
        user,
        site,
    });

    if (existingAuth) {
        existingAuth.auth = auth;
        await existingAuth.save();
    } else {
        let siteAuth = new SiteAuth({
            user,
            site,
            auth,
        });
        await siteAuth.save();
    }

    res.redirect(`${process.env.CLIENT_URL}/sites`);
    return;
};

export { authSite, handleAuthCallback };
