let express = require("express");
let app = express();
let { toBuffer } = require("qrcode");
const { default: makeWASocket, useSingleFileAuthState, Browsers, delay } = require("@adiwajshing/baileys");
const pino = require("pino");
const fs = require("fs");
const PastebinAPI = require("pastebin-js");

const pastebin = new PastebinAPI("h4cO2gJEMwmgmBoteYufW6_weLvBYCqT");
let PORT = process.env.PORT || 3030;

app.use("/", (req, res) => {
  const authfile = `./tmp/${Math.random().toString(36).substring(2, 11)}.json`;
  const { state, saveState } = useSingleFileAuthState(authfile);

  async function startSession() {
    try {
      let session = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
      });

      session.ev.on("connection.update", async (s) => {
        if (s.qr) {
          res.type('image/png');
          res.end(await toBuffer(s.qr));
        }
        const { connection } = s;
        if (connection == "open") {
          await delay(5000);
          
          // Pastebin-ലേക്ക് അപ്‌ലോഡ് ചെയ്യുന്നു
          let link = await pastebin.createPasteFromFile(authfile, "ZENX-SESSION", null, 1, "N");
          let pasteID = link.replace("https://pastebin.com/", "");
          let finalID = `ZENX~${pasteID}`;

          await session.sendMessage(session.user.id, { text: finalID });
          await session.sendMessage(session.user.id, {
            document: { url: authfile },
            fileName: "session.json",
            mimetype: "application/json",
          });

          console.log("Session Generated: " + finalID);
          setTimeout(() => { process.exit(0); }, 5000);
        }
      });
      session.ev.on('creds.update', saveState);
    } catch (err) { console.log(err); }
  }
  startSession();
});
app.listen(PORT, () => console.log("Session Gen on port", PORT));
