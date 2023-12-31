import jwt from "jsonwebtoken";
import User from "../models/user";

class JWTUtils{
    
    static generateAccessToken(email: string){
        const accessTokenSecret = process.env.JWT_SECRET;
        const accessToken = jwt.sign({ email }, accessTokenSecret, { expiresIn: '1h' });
        return accessToken;
    }

    static verifyAccessToken(token: string){
        const accessTokenSecret = process.env.JWT_SECRET;
        try{
            jwt.verify(token, accessTokenSecret);
            return true;
        }catch(e){
            return false;
        }
    }

    static async authorisedUserMiddleware(req, res, next){
        const token = req.cookies.token;
        
        if(!JWTUtils.verifyAccessToken(token)){
            return res.status(401).json({
                error: "Invalid token",
            });
        }

        const decoded = jwt.decode(token) as any;

        if(!decoded){
            return res.status(401).json({
                error: "Invalid token",
            });
        }
        
        if(!decoded.email){
            return res.status(401).json({
                error: "Invalid user",
            });
        }

        const user = await User.findOne({
            email: decoded.email,
        });

        if(!user){
            return res.status(401).json({
                error: "Invalid user",
            });
        }

        req.user = user;

        next();
    }
}

export default JWTUtils;