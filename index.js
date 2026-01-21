const express = require("express");
const app = express();
const { toBuffer } = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
  makeCacheableSignalKeyStore,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const PastebinAPI = require("pastebin-js");
const pastebin = new PastebinAPI("h4cO2gJEMwmgmBoteYufW6_weLvBYCqT");

let PORT = process.env.PORT || 3030;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body style="font-family:Arial; text-align:center; padding-top:50px; background-color:#f4f4f9;">
        <h2 style="color:#075e54;">WhatsApp Session Generator</h2>
        <div style="margin:20px;">
          <button onclick="location.href='/qr'" style="padding:15px 30px; background:#25d366; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Get QR Code</button>
        </div>
        <div>
          <button onclick="pair()" style="padding:15px 30px; background:#128c7e; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;">Get Pairing Code</button>
        </div>
        <script>
          function pair() {
            let num = prompt("Enter your number with country code (e.g. 919876543210):");
            if(num) location.href = '/pair?num=' + num;
          }
        </script>
      </body>
    </html>
  `);
});

app.get("/pair", async (req, res) => {
  let num = req.query.num;
  if (!num) return res.send("Number is required!");

  const authFolder = `./tmp/${num}_${Math.random().toString(36).substring(7)}`;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  try {
    let session = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Chrome (Linux)", "", ""] // "Couldn't link device" ഒഴിവാക്കാൻ
    });

    if (!session.authState.creds.registered) {
      await delay(3000); // കണക്ഷൻ സ്റ്റേബിൾ ആകാൻ സമയം നൽകുന്നു
      let code = await session.requestPairingCode(num);
      if (!res.headersSent) {
        res.send(`
          <div style="text-align:center; padding-top:50px; font-family:Arial;">
            <h3>Your Pairing Code:</h3>
            <h1 style="color:#ff0000; font-size:50px; letter-spacing:5px;">${code}</h1>
            <p>Go to WhatsApp > Linked Devices > Link a Device > <b>Link with phone number instead</b></p>
          </div>
        `);
      }
    }

    session.ev.on("creds.update", saveCreds);
    session.ev.on("connection.update", async (s) => {
      const { connection, lastDisconnect } = s;
      if (connection === "open") {
        await delay(10000); // ഫയൽ സേവ് ആകാൻ 10 സെക്കൻഡ് നൽകുന്നു
        
        let link = await pastebin.createPasteFromFile(`${authFolder}/creds.json`, "Millie-MD session", null, 0, "N");
        let data = link.replace("https://pastebin.com/", "");
        
        // പഴയ രീതിയിലുള്ള സെഷൻ ഐഡി ജനറേഷൻ
        let code = btoa(data);
        var words = code.split("");
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

app.get("/", (req, res) => {
  res.send("ZENX Session Generator is Running on Vercel!");
});

app.get("/pair", async (req, res) => {
  let num = req.query.num;
  if (!num) return res.send("നമ്പർ നൽകുക!");

  // Vercel-ൽ /tmp ഫോൾഡർ മാത്രമേ റൈറ്റ് ചെയ്യാൻ പറ്റൂ
  const tempDir = `/tmp/${Math.random().toString(36).substring(7)}`;
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(tempDir);

  try {
    let session = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
      },
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Chrome (Linux)", "", ""]
    });

    if (!session.authState.creds.registered) {
      await delay(3000);
      let code = await session.requestPairingCode(num);
      res.send(`<h1>Your Code: ${code}</h1>`);
    }

    session.ev.on("creds.update", saveCreds);
    session.ev.on("connection.update", async (s) => {
      if (s.connection === "open") {
        await delay(5000);
        const credsFile = `${tempDir}/creds.json`;
        let link = await pastebin.createPasteFromFile(credsFile, "ZENX-SESSION", null, 0, "N");
        let data = link.replace("https://pastebin.com/", "");
        
        let base64Data = Buffer.from(data).toString('base64');
        let words = base64Data.split("");
        let mid = words[Math.floor(words.length / 2)];
        let finalID = base64Data.split(mid).join(mid + "_XASENA_");

        await session.sendMessage(session.user.id, { text: finalID });
        console.log("Session sent!");
      }
    });
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

module.exports = app; // Vercel-ന് വേണ്ടി ഇത് നിർബന്ധമാണ്

ull, 0, "N");
      let data = link.replace("https://pastebin.com/", "");
      let code = btoa(data);
      var words = code.split("");
      var ress = words[Math.floor(words.length / 2)];
      let finalID = code.split(ress).join(ress + "_XASENA_");
      
      await session.sendMessage(session.user.id, { text: finalID });
      process.exit(0);
    }
  });
  session.ev.on("creds.update", saveCreds);
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
