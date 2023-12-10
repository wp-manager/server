import mongoose from "mongoose"

const authenticatorSchema = new mongoose.Schema({
  credentialID: String,
  credentialPublicKey: String,
  counter: Number,
  credentialDeviceType: String,
  credentialBackedUp: Boolean,
  transports: Array<String>
});

const Authenticator = mongoose.model("Authenticator", authenticatorSchema);

export default Authenticator;