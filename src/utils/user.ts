import User from "../models/user";
import bcrypt from "bcrypt";

class UserUtils {

    static async isEmailAvailable(email: string): Promise<boolean> {
        const user = await User.findOne({
            email,
        });

        return !user;
    }

    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }       

}

export default UserUtils