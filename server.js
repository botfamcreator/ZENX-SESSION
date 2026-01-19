const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/pair', async (req, res) => {
    let num = req.query.num;
    const { state, saveCreds } = await useMultiFileAuthState('temp_session');
    const conn = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });

    if (!conn.authState.creds.registered) {
        await delay(2000);
        let code = await conn.requestPairingCode(num);
        res.send(`<h1>Your Pairing Code: ${code}</h1><p>Enter this code in your WhatsApp Linked Devices.</p>`);
    }

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('connection.update', async (s) => {
        if (s.connection === 'open') {
            const sessionID = Buffer.from(JSON.stringify(conn.authState.creds)).toString('base64');
            await conn.sendMessage(conn.user.id, { text: `Zenx;${sessionID}` });
            process.exit(0);
        }
    });
});

app.get('/qr', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('temp_qr');
    const conn = makeWASocket({ auth: state, logger: pino({ level: 'silent' }) });

    conn.ev.on('events.on', () => {});
    conn.ev.on('connection.update', async (s) => {
        if (s.qr) {
            let url = await QRCode.toDataURL(s.qr);
            res.send(`<h1>Scan this QR Code</h1><img src="${url}">`);
        }
        if (s.connection === 'open') {
            const sessionID = Buffer.from(JSON.stringify(conn.authState.creds)).toString('base64');
            await conn.sendMessage(conn.user.id, { text: `Zenx;${sessionID}` });
            process.exit(0);
        }
    });
    conn.ev.on('creds.update', saveCreds);
});

app.listen(PORT, () => console.log(`Generator running on port ${POR
T}`));
