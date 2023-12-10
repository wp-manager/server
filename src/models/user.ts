import mongoose from "mongoose"
import Authenticator from "./authenticator";

const userSchema = new mongoose.Schema({
    username: String,
    currentChallenge: String,
    devices: [Authenticator.schema]
});

const User = mongoose.model("User", userSchema);

export default User;