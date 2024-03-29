import SiteAuth from "../models/site-auth";
import User from "../models/user";
import WPEngineAuth from "../plugins/wp-engine-proxy/models/wp-engine-auth";
import JWTUtils from "../utils/jwt";
import UserUtils from "../utils/user";

const getAccount = async (req, res) => {

    const authdSites = await SiteAuth.find({
        user: req.user,
    }).populate("site");

    let siteUrls = authdSites.map((siteAuth) => {
        return siteAuth.site.uri.replace("https://", "").replace("http://", "");
    });

    // sort alphabetically
    siteUrls.sort();

    // Get WPE Auths
    const wpeAuth = await WPEngineAuth.findOne({
        user: req.user,
    });



    res.json({
        email: req.user.email,
        sites: siteUrls,
        plugins: req.user.plugins.map((plugin) => {
            return plugin.path;
        }),
        wpe: !!wpeAuth
    });
}

const emailAvailability = async (req, res) => {
    const { email } = req.body;

    if(!email){
        res.status(400).json({
            message: "Email is required",
        });
        return;
    }
    
    const available = await UserUtils.isEmailAvailable(email);

    res.json({
        available
    });
}

const register = async (req, res) => {
    const { email, password } = req.body;

    if(!email){
        res.status(401).json({
            message: "Please enter an email",
        });
        return;
    }

    // Check if email is a valid email using regex
    const emailRegex = /\S+@\S+\.\S+/;
    if(!emailRegex.test(email)){
        res.status(401).json({
            message: "Please enter a valid email",
        });
        return;
    }

    if(!password){
        res.status(401).json({
            message: "Please enter a password",
        });
        return;
    }

    // Check if email is taken
    const available = await UserUtils.isEmailAvailable(email);

    if(!available){
        res.status(409).json({
            message: "That email already exists",
        });
        return;
    }

    const hashedPassword = await UserUtils.hashPassword(password);

    const user = new User({
        email,
        password: hashedPassword,
    });
    await user.save();

    res.json({
        email: user.email,
    });
}

const login = async (req, res) => {
    const { email, password } = req.body;
    
    if(!email){
        res.status(401).json({
            message: "Please enter an email",
        });
        return;
    }

    // Check if email is a valid email using regex
    const emailRegex = /\S+@\S+\.\S+/;
    if(!emailRegex.test(email)){
        res.status(401).json({
            message: "Please enter a valid email",
        });
        return;
    }

    if(!password){
        res.status(401).json({
            message: "Please enter a password",
        });
        return;
    }

    // Check if email is valid
    const available = await UserUtils.isEmailAvailable(email);

    if(available){
        res.status(401).json({
            message: "No account exists with that email",
        });
        return;
    }

    const user = await User.findOne({
        email,
    });

    const passwordValid = await UserUtils.verifyPassword(password, user.password);

    if(!passwordValid){
        res.status(401).json({
            message: "Incorrect password",
        });
        return;
    }

    const token = await JWTUtils.generateAccessToken(user.email);

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
    }).status(200).json({
        id: user.id,
        email: user.email,
    });

}

const logout = async (req, res) => {
    // set new cookie, set expiry to 1 minute ago
    res.cookie("token", "", {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() - 60000),
    }).sendStatus(200);
};

export {
    getAccount,
    emailAvailability,
    register,
    login,
    logout,
}