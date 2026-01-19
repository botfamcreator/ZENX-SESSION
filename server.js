const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, jidNormalizedUser } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// പെയറിംഗ് കോഡ് വഴി സെഷൻ എടുക്കാൻ
app.get('/pair', async (req, res) => {
    let num = req.query.num;
    if (!num) return res.send("Please provide a number with country code (e.g., 919876543210)");
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const conn = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    if (!conn.authState.creds.registered) {
        await delay(1500);
        try {
            let code = await conn.requestPairingCode(num);
            res.send(`<h1>Your Pairing Code: <span style="color:blue">${code}</span></h1><p>Check your WhatsApp notification and enter this code.</p>`);
        } catch (err) {
            res.send("Error requesting pairing code. Please try again later.");
        }
    }

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('connection.update', async (s) => {
        const { connection } = s;
        if (connection === 'open') {
            await delay(2000);
            const sessionID = Buffer.from(JSON.stringify(conn.authState.creds)).toString('base64');
            const finalID = `ZENX~${sessionID}`;
            
            await conn.sendMessage(conn.user.id, { text: finalID });
            console.log("Session ID sent in ZENX~ format!");
        }
    });
});

// QR Code വഴി സെഷൻ എടുക്കാൻ
app.get('/qr', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_qr');
    const conn = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    conn.ev.on('connection.update', async (s) => {
        if (s.qr) {
            let url = await QRCode.toDataURL(s.qr);
            res.send(`<h1>Scan this QR Code</h1><img src="${url}" width="300">`);
        }
        if (s.connection === 'open') {
            await delay(2000);
            const sessionID = Buffer.from(JSON.stringify(conn.authState.creds)).toString('base64');
            const finalID = `ZENX~${sessionID}`;
            
            await conn.sendMessage(conn.user.id, { text: finalID });
            console.log("Session ID sent in ZENX~ format!");
        }
    });
    conn.ev.on('creds.update', saveCreds);
});

app.listen(PORT, () => {
    console.log(`ZENX Session Generator running on port ${PORT}`);
});
