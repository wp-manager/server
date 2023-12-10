import {
    GenerateAuthenticationOptionsOpts,
    GenerateRegistrationOptionsOpts,
    VerifiedAuthenticationResponse,
    VerifiedRegistrationResponse,
    VerifyAuthenticationResponseOpts,
    VerifyRegistrationResponseOpts,
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from "@simplewebauthn/server";
import User from "../models/user";
import Authenticator from "../models/authenticator";
import {
    AuthenticationResponseJSON,
    RegistrationResponseJSON,
} from "@simplewebauthn/typescript-types";

const login = async (req, res) => {
    let user = await User.findOne({
        name: "MrDarrenGriffin",
    });

    res.json(user);
};

let generatePasskeyRegistrationOptions = async (req, res) => {
    const user = await User.findOne({
        username: "MrDarrenGriffin",
    });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const opts: GenerateRegistrationOptionsOpts = {
        rpName: process.env.RP_NAME,
        rpID: process.env.RP_ID,
        userID: user.id,
        userName: user.username,
        timeout: 60000,
        attestationType: "none",
        excludeCredentials: user.devices.map((device) => ({
            id: Buffer.from(device.credentialID, "base64"),
            type: "public-key",
            transports: device.transports,
        })),
        authenticatorSelection: {
            residentKey: "discouraged",
        },
        supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
};

let generatePasskeyAuthenticationOptions = async (req, res) => {
    const user = await User.findOne({
        username: "MrDarrenGriffin",
    });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: user.devices.map((device) => ({
            id: Buffer.from(device.credentialID, "base64"),
            type: "public-key",
            transports: device.transports,
        })),
        userVerification: "required",
        rpID: process.env.RP_ID,
    };

    const options = await generateAuthenticationOptions(opts);

    user.currentChallenge = options.challenge;
    await user.save();

    res.json(options);
};

let verifyPasskeyRegistrationResponse = async (req, res) => {
    const body: RegistrationResponseJSON = req.body;

    console.log(body);
    const user = await User.findOne({
        username: "MrDarrenGriffin",
    });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const expectedChallenge = user.currentChallenge;

    let verification: VerifiedRegistrationResponse;

    try {
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge,
            expectedOrigin: process.env.RP_ORIGIN,
            expectedRPID: process.env.RP_ID,
            requireUserVerification: true,
        };
        verification = await verifyRegistrationResponse(opts);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo;

        const existingDevice = await user.devices.find((device) => {
            return (
                device.credentialID ===
                Buffer.from(credentialID).toString("base64")
            );
        });

        if (!existingDevice) {
            let authenticator = new Authenticator({
                user: user.id,
                // Store as base64 string instead of UInt8Array to make it easier to work with in the DB
                credentialID: Buffer.from(credentialID).toString("base64"),
                credentialPublicKey:
                    Buffer.from(credentialPublicKey).toString("base64"),
                counter,
                transports: body.response.transports,
            });
            await authenticator.save();

            user.devices.push(authenticator);
            await user.save();
        }
    }

    user.currentChallenge = null;
    await user.save();

    res.json({
        verified,
        registrationInfo,
    });
};

let verifyPasskeyAuthenticationResponse = async (req, res) => {
    const body: AuthenticationResponseJSON = req.body;

    const user = await User.findOne({
        username: "MrDarrenGriffin",
    });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const expectedChallenge = user.currentChallenge;

    let dbAuthenticator: any;

    user.devices.forEach((device) => {
        if (
            new Uint8Array(
                Buffer.from(device.credentialID, "base64")
            ).toString() ==
            new Uint8Array(Buffer.from(body.id, "base64")).toString()
        ) {
            dbAuthenticator = device;
        }
    });

    if (!dbAuthenticator) {
        res.status(404).send("Authenticator not found");
        return;
    }

    let verification: VerifiedAuthenticationResponse;

    console.log(expectedChallenge);

    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: body,
            expectedChallenge: `${expectedChallenge}`,
            expectedOrigin: process.env.RP_ORIGIN,
            expectedRPID: process.env.RP_ID,
            authenticator: dbAuthenticator,
            requireUserVerification: true,
        };
        verification = await verifyAuthenticationResponse(opts);
        console.log(verification);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
        dbAuthenticator.counter = authenticationInfo.newCounter;
        await dbAuthenticator.save();
    }

    user.currentChallenge = null;
    await user.save();

    res.json({
        verified,
        authenticationInfo,
    });
};

export {
    login,
    generatePasskeyRegistrationOptions,
    verifyPasskeyRegistrationResponse,
    generatePasskeyAuthenticationOptions,
    verifyPasskeyAuthenticationResponse,
};
