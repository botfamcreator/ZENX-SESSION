const express = require("express");
const app = express();
const { toBuffer } = require("qrcode");
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const PastebinAPI = require("pastebin-js");

const pastebin = new PastebinAPI("h4cO2gJEMwmgmBoteYufW6_weLvBYCqT");
let PORT = process.env.PORT || 3030;

app.get("/", (req, res) => {
    res.send(`<html><body style="font-family:Arial;text-align:center;padding-top:50px;">
    <h2>ZENX SESSION GENERATOR</h2>
    <button onclick="location.href='/qr'" style="padding:10px;background:green;color:white;border:none;border-radius:5px;">GET QR CODE</button>
    <br><br>
    <button onclick="let n=prompt('Enter Number with Country Code (91...)');if(n)location.href='/pair?num='+n" style="padding:10px;background:blue;color:white;border:none;border-radius:5px;">GET PAIRING CODE</button>
    </body></html>`);
});

app.get("/pair", async (req, res) => {
    let num = req.query.num;
    const { state, saveCreds } = await useMultiFileAuthState(`./tmp/${num}`);
    let session = makeWASocket({ auth: state, logger: pino({ level: "silent" }), browser: Browsers.macOS("Desktop") });

    if (!session.authState.creds.registered) {
        await delay(1500);
        let code = await session.requestPairingCode(num);
        res.send(`<h1>Your Code: ${code}</h1>`);
    }

    session.ev.on("creds.update", saveCreds);
    session.ev.on("connection.update", async (s) => {
        if (s.connection === "open") {
            await delay(5000);
            const authfile = `./tmp/${num}/creds.json`;
            let link = await pastebin.createPasteFromFile(authfile, "ZENX-SESSION", null, 1, "N");
            let pasteID = link.replace("https://pastebin.com/", "");
            await session.sendMessage(session.user.id, { text: `ZENX~${pasteID}` });
            process.exit(0);
        }
    });
});

app.get("/qr", async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState(`./tmp/qr`);
    let session = makeWASocket({ auth: state, logger: pino({ level: "silent" }), browser: Browsers.macOS("Desktop") });

    session.ev.on("connection.update", async (s) => {
        if (s.qr) { res.type('image/png'); res.end(await toBuffer(s.qr)); }
        if (s.connection === "open") {
            await delay(5000);
            const authfile = `./tmp/qr/creds.json`;
            let link = await pastebin.createPasteFromFile(authfile, "ZENX-SESSION", null, 1, "N");
            let pasteID = link.replace("https://pastebin.com/", "");
            await session.sendMessage(session.user.id, { text: `ZENX~${pasteID}` });
            process.exit(0);
        }
    });
    session.ev.on("creds.update", saveCreds);
});

app.listen(PORT, () => console.log("Run on", PORT));
