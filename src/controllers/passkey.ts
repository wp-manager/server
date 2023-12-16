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
import {
    isoUint8Array, isoBase64URL
} from "@simplewebauthn/server/helpers";
import fs from "fs";
import { getUser } from "./auth";
let tempuser;
let authenticators;

tempuser = JSON.parse(fs.readFileSync('user.json').toString());
authenticators = JSON.parse(fs.readFileSync('authenticators.json').toString());

setInterval(() => {
    fs.writeFileSync('user.json', JSON.stringify(tempuser));
    fs.writeFileSync('authenticators.json', JSON.stringify(authenticators));
}, 1000);



const login = async (req, res) => {
    let user = await getUser();

    res.send(user);
};

let generatePasskeyRegistrationOptions = async (req, res) => {
    const user = await getUser();

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const opts: GenerateRegistrationOptionsOpts = {
        rpName: process.env.RP_NAME,
        rpID: process.env.RP_ID,
        userID: tempuser.id,
        userName: tempuser.username,
        timeout: 60000,
        attestationType: "none",
        excludeCredentials: tempuser.devices.map((device) => ({
            id: device.credentialID,
            type: "public-key",
            transports: device.transports,
        })),
        authenticatorSelection: {
            residentKey: "discouraged",
        },
        supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);

    tempuser.currentChallenge = options.challenge;
    //await user.save();

    res.send(options);
};

let generatePasskeyAuthenticationOptions = async (req, res) => {
    const user = await getUser();

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: tempuser.devices.filter(a => a.id).map((device) => ({
            id: device.credentialID,
            type: "public-key",
            transports: device.transports,
        })),
        userVerification: "required",
        rpID: process.env.RP_ID,
    };

    const options = await generateAuthenticationOptions(opts);

    tempuser.currentChallenge = options.challenge;
    //await user.save();

    res.send(options);
};

let verifyPasskeyRegistrationResponse = async (req, res) => {
    const body: RegistrationResponseJSON = req.body;

    const user = await getUser();

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const expectedChallenge = tempuser.currentChallenge;

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

        const existingDevice = await tempuser.devices.find((device) => {
            isoUint8Array.areEqual(device.credentialID, credentialID)
        });

        if (!existingDevice) {
            let authenticator = {
                credentialPublicKey,
                credentialID,
                counter,
                transports: body.response.transports,
            };
           // await authenticator.save();
           //authenticators.push(authenticator);

           tempuser.devices.push(authenticator);
           // await user.save();
        }
    }

    tempuser.currentChallenge = null;
   // await user.save();

    res.send({
        verified
    });
};

let verifyPasskeyAuthenticationResponse = async (req, res) => {
    const body: AuthenticationResponseJSON = req.body;

    const user = await getUser();

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const expectedChallenge = tempuser.currentChallenge;

    let dbAuthenticator: any;
    const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);

    tempuser.devices.forEach((device) => {
        if (isoUint8Array.areEqual(device.credentialID, bodyCredIDBuffer)) {
            dbAuthenticator = device;
        }
    });

    if (!dbAuthenticator) {
        return res.status(404).send({
            error: "Authenticator not found",
        });

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
        console.log(error)
        res.status(400).send(error.message);
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
        dbAuthenticator.counter = authenticationInfo.newCounter;
        //await dbAuthenticator.save();
    }

    tempuser.currentChallenge = null;
   // await user.save();

    res.send({
        verified
    });
};

export {
    login,
    generatePasskeyRegistrationOptions,
    verifyPasskeyRegistrationResponse,
    generatePasskeyAuthenticationOptions,
    verifyPasskeyAuthenticationResponse,
};
