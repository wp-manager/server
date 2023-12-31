import User from "../models/user";
import JWTUtils from "../utils/jwt";
import UserUtils from "../utils/user";

const getAuthdUser = async (req, res) => {
    // only include id and username
    res.json({
        id: req.user.id,
        email: req.user.email,
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
        id: user.id,
        email: user.email,
    });
}

const login = async (req, res) => {
    const { email, password } = req.body;

    // Check if email is valid
    const available = await UserUtils.isEmailAvailable(email);

    if(available){
        res.status(401).json({
            message: "Email is invalid",
        });
        return;
    }

    const user = await User.findOne({
        email,
    });

    const passwordValid = await UserUtils.verifyPassword(password, user.password);

    if(!passwordValid){
        res.status(401).json({
            message: "Password is invalid",
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
    getAuthdUser,
    emailAvailability,
    register,
    login,
    logout,
}