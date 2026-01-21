let express = require("express");
let app = express();
let { toBuffer } = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const PastebinAPI = require("pastebin-js");
const pastebin = new PastebinAPI("h4cO2gJEMwmgmBoteYufW6_weLvBYCqT");

let PORT = process.env.PORT || 3030;

app.get("/", (req, res) => {
  res.send(`
    <div style="text-align:center; padding:50px; font-family:Arial;">
      <h2>WhatsApp Session Generator</h2>
      <button onclick="location.href='/qr'" style="padding:15px; margin:10px; background:green; color:white; border:none; cursor:pointer;">QR Code വഴി സ്കാൻ ചെയ്യുക</button>
      <br>
      <button onclick="pair()" style="padding:15px; margin:10px; background:blue; color:white; border:none; cursor:pointer;">Pairing Code വഴി കണക്ട് ചെയ്യുക</button>
      <script>
        function pair() {
          let num = prompt("Enter your number with country code (e.g. 919876543210):");
          if(num) location.href = '/pair?num=' + num;
        }
      </script>
    </div>
  `);
});

app.get("/pair", async (req, res) => {
  let num = req.query.num;
  const authfile = `./tmp/${Math.random().toString(36).substring(2, 11)}`;
  const { state, saveCreds } = await useMultiFileAuthState(authfile);

  try {
    let session = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!session.authState.creds.registered) {
      await delay(1500);
      let code = await session.requestPairingCode(num);
      res.send(`<h1 style="text-align:center; margin-top:50px;">Your Code: <span style="color:red">${code}</span></h1>`);
    }

    session.ev.on("creds.update", saveCreds);
    session.ev.on("connection.update", async (s) => {
      if (s.connection === "open") {
        await delay(5000);
        let link = await pastebin.createPasteFromFile(`${authfile}/creds.json`, "Millie-MD session", null, 0, "N");
        let data = link.replace("https://pastebin.com/", "");
        
        // നീ ആദ്യം തന്ന അതേ XASENA ഫോർമാറ്റ് ലോജിക്
        let code = btoa(data);
        var words = code.split("");
        var ress = words[Math.floor(words.length / 2)];
        let c = code.split(ress).join(ress + "_XASENA_");

        await session.sendMessage(session.user.id, { text: c });
        await session.sendMessage(session.user.id, {
          document: { url: `${authfile}/creds.json` },
          fileName: "session.json",
          mimetype: "application/json",
        });

        setTimeout(() => { process.exit(0); }, 5000);
      }
    });
  } catch (err) { res.send("Error: " + err.message); }
});

app.get("/qr", async (req, res) => {
  const authfile = `./tmp/qr_${Math.random().toString(36).substring(2, 11)}`;
  const { state, saveCreds } = await useMultiFileAuthState(authfile);
  let session = makeWASocket({ auth: state, logger: pino({ level: "silent" }), browser: Browsers.macOS("Desktop") });

  session.ev.on("connection.update", async (s) => {
    if (s.qr) { res.type('image/png'); res.end(await toBuffer(s.qr)); }
    if (s.connection === "open") {
      await delay(5000);
      let link = await pastebin.createPasteFromFile(`${authfile}/creds.json`, "Millie-MD session", null, 0, "N");
      let data = link.replace("https://pastebin.com/", "");
      let code = btoa(data);
      var words = code.split("");
      var ress = words[Math.floor(words.length / 2)];
      let c = code.split(ress).join(ress + "_XASENA_");
      await session.sendMessage(session.user.id, { text: c });
      process.exit(0);
    }
  });
  session.ev.on("creds.update", saveCreds);
});

app.listen(PORT, () => console.log("Server listening on port", PORT));
