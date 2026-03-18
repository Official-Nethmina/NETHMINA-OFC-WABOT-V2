const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const express = require('express');
const path = require('path');

const config = require('./config');
const { sms } = require('./lib/msg');
const { getGroupAdmins } = require('./lib/functions');
const { commands, replyHandlers } = require('./command');
const { File } = require('megajs');

const app = express();
const port = process.env.PORT || 8000;

const prefix = '.';
const ownerNumber = ['94701332157']; // bot owner numbers
const credsPath = path.join(__dirname, '/auth_info_baileys/creds.json');

// ---------------------- SESSION HANDLER ----------------------
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error('❌ SESSION_ID env variable is missing. Cannot restore session.');
      process.exit(1);
    }

    console.log("🔄 creds.json not found. Downloading session from MEGA...");
    const sessdata = config.SESSION_ID;
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

    filer.download((err, data) => {
      if (err) {
        console.error("❌ Failed to download session file from MEGA:", err);
        process.exit(1);
      }

      fs.mkdirSync(path.join(__dirname, '/auth_info_baileys/'), { recursive: true });
      fs.writeFileSync(credsPath, data);
      console.log("✅ Session downloaded and saved. Restarting bot...");
      setTimeout(() => connectToWA(), 2000);
    });
  } else {
    setTimeout(() => connectToWA(), 1000);
  }
}

// ---------------------- CONNECT TO WHATSAPP ----------------------
async function connectToWA() {
  console.log("Connecting NETHMINA OFC 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '/auth_info_baileys/'));
  const { version } = await fetchLatestBaileysVersion();

  const nethmina = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  // ---------------------- CONNECTION EVENTS ----------------------
  nethmina.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('✅ NETHMINA OFC connected to WhatsApp');

      const up = `*🤖 𝐖𝙴𝙻𝙲𝙾𝙼𝙴 𝐓𝙾 𝐍𝙴𝚃𝙷𝙼𝙸𝙽𝙰 𝐎ƒᴄ 𝐖𝙰 𝐁𝙾𝚃 🤖*\n\n*BOT CONNECTED SUCCESSFULLY ✅*\n\n*🧿 PREFIX: [${prefix}]*\n\n*✏ Type .alive for check bot active or not.*\n*📝 Type .menu to get bot command list.*\n\n*Contact Bot Owner 👤*\n\n*https://wa.me/message/5AWGRCFVNFAPE1*\n\n*🧩 You can join my whatsapp group 🧩*\n\nhttps://chat.whatsapp.com/FUGjjEbLPQp7KHL5jAUJb8\n\n*BOT CONNECTED* ✅\n\n> ᴩᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;
      
      await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: `https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true` },
        caption: up
      });

      fs.readdirSync("./plugins/").forEach(plugin => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require(`./plugins/${plugin}`);
        }
      });
    }
  });

  nethmina.ev.on('creds.update', saveCreds);

  // ---------------------- MESSAGE EVENTS ----------------------
  nethmina.ev.on('messages.upsert', async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;
      if (mek.messageStubType === 68) {
        await nethmina.sendMessageAck(mek.key);
      }

      mek.message = getContentType(mek.message) === 'ephemeralMessage'
        ? mek.message.ephemeralMessage.message
        : mek.message;

      if (mek.key.remoteJid === 'status@broadcast') continue;

      const from = mek.key.remoteJid;
      const sender = mek.key.fromMe ? nethmina.user.id : (mek.key.participant || mek.key.remoteJid);
      const senderNumber = sender.split('@')[0];

      // ---------------------- OWNER AUTO REACT ----------------------
      const isReact = mek.message?.reactionMessage ? true : false;
      if (ownerNumber.includes(senderNumber) && !isReact) {
        await nethmina.sendMessage(from, {
          react: { text: "🧑🏻‍💻", key: mek.key }
        });
      }

      // ---------------------- COMMAND HANDLING ----------------------
      const m = sms(nethmina, mek);
      const type = getContentType(mek.message);
      const body = type === 'conversation' ? mek.message.conversation : mek.message[type]?.text || mek.message[type]?.caption || '';
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : '';
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      const isGroup = from.endsWith('@g.us');
      const botNumber = nethmina.user.id.split(':')[0];
      const pushname = mek.pushName || 'Sin Nombre';
      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const botNumber2 = await jidNormalizedUser(nethmina.user.id);

      const groupMetadata = isGroup ? await nethmina.groupMetadata(from).catch(() => {}) : '';
      const groupName = isGroup ? groupMetadata.subject : '';
      const participants = isGroup ? groupMetadata.participants : '';
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

      const reply = (text) => nethmina.sendMessage(from, { text }, { quoted: mek });

      if (isCmd) {
        const cmd = commands.find(c => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
        if (cmd) {
          if (cmd.react) {
            await nethmina.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
          }
          try {
            await cmd.function(nethmina, mek, m, {
              from, quoted: mek, body, isCmd, command: commandName, args, q,
              isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
              isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
              isBotAdmins, isAdmins, reply,
            });
          } catch (e) {
            console.error("[PLUGIN ERROR]", e);
          }
        }
      }

      const replyText = body;
      for (const handler of replyHandlers) {
        if (handler.filter(replyText, { sender, message: mek })) {
          try {
            await handler.function(nethmina, mek, m, { from, quoted: mek, body: replyText, sender, reply });
            break;
          } catch (e) {
            console.log("Reply handler error:", e);
          }
        }
      }
    }
  });
}

// ---------------------- START BOT ----------------------
ensureSessionFile();

// ---------------------- EXPRESS SERVER ----------------------
app.get("/", (req, res) => {
  res.send("Hey, NETHMINA-OFC started✅");
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
