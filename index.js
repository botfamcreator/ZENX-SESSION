const express = require("express");
const app = express();
const { toBuffer } = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const PastebinAPI = require("pastebin-js");
const pastebin = new PastebinAPI("h4cO2gJEMwmgmBoteYufW6_weLvBYCqT");

let PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send(`
    <div style="text-align:center; margin-top:50px; font-family:Arial;">
      <h2>ZENX SESSION GENERATOR</h2>
      <button onclick="pair()" style="padding:15px; background:blue; color:white; border:none; border-radius:5px;">Get Pairing Code</button>
      <script>
        function pair() {
          let num = prompt("Enter number with country code (91...):");
          if(num) location.href = '/pair?num=' + num;
        }
      </script>
    </div>
  `);
});

app.get("/pair", async (req, res) => {
  let num = req.query.num;
  const authFolder = `./session_${Math.random().toString(36).substring(7)}`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  try {
    let session = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!session.authState.creds.registered) {
      await delay(2000);
      let code = await session.requestPairingCode(num);
      res.send(`<h1 style="text-align:center; margin-top:50px;">Code: ${code}</h1>`);
    }

    session.ev.on("creds.update", saveCreds);
    session.ev.on("connection.update", async (s) => {
      if (s.connection === "open") {
        await delay(5000);
        let link = await pastebin.createPasteFromFile(`${authFolder}/creds.json`, "ZENX-SESSION", null, 0, "N");
        let data = link.replace("https://pastebin.com/", "");
        
        let base64Data = Buffer.from(data).toString('base64');
        let words = base64Data.split("");
        let mid = words[Math.floor(words.length / 2)];
        let finalID = base64Data.split(mid).join(mid + "_XASENA_");

        await session.sendMessage(session.user.id, { text: finalID });
        console.log("Session ID Sent!");
      }
    });
  } catch (err) { res.send("Error: " + err.message); }
});

app.listen(PORT, () => console.log("Server on", PORT));
