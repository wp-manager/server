import jwt from "jsonwebtoken";
import User from "../models/user";

class JWTUtils{
    
    static generateAccessToken(email: string){
        const accessTokenSecret = process.env.JWT_SECRET;
        const accessToken = jwt.sign({ email }, accessTokenSecret, { expiresIn: '12h' });
        return accessToken;
    }

    static verifyAccessToken(token: string){
        const accessTokenSecret = process.env.JWT_SECRET;
        try{
            jwt.verify(token, accessTokenSecret);
            return true;
        }catch(e){
            console.log(e);
            return false;
        }
    }

    static async authorisedUserMiddleware(req, res, next){
        const token = req.cookies.token;

        if(!token){
            res.status(401).json({
                message: "Not authorised",
            });
            return;
        }
        
        const authorisedTokenUser = await JWTUtils.authorisedUser(token);
        if(!authorisedTokenUser){
            res.status(401).json({
                message: "Not authorised",
            });
            return;
        }

        req.user = authorisedTokenUser;

        next();
    }

    static async authorisedUser(token){
        if(!JWTUtils.verifyAccessToken(token)){
            return false;
        }
        
        const decoded = jwt.decode(token) as any;
        
        if(!decoded){
            return false;
        }
        
        if(!decoded.email){
            return false;
        }

        const user = await User.findOne({
            email: decoded.email,
        });

        if(!user){
            return false;
        }

        return user;
    }
}

export default JWTUtils;