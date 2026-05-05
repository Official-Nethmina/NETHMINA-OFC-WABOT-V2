// ====================== IMPORTS ======================
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  Browsers
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");
const axios = require('axios');
const { exec } = require('child_process');
const config = require("./config");
const ffmpegPath = require('ffmpeg-static');
const { sms } = require("./lib/msg");
const { commands, replyHandlers } = require("./command");
const { File } = require("megajs");

// ====================== SERVER ======================
const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("NETHMINA-OFC WA-BOT Running Successfully 🚀");
});

app.listen(port, () =>
  console.log(`Server running → http://localhost:${port}`)
);

// ====================== CONFIG ======================
const prefix = ".";
const ownerNumber = ["94760860835"];
const credsPath = path.join(__dirname, "/auth_info_baileys/creds.json");

// ====================== PLUGIN SYSTEM ======================
global.pluginHooks = global.pluginHooks || [];
const antiDeletePlugin = require("./plugins/antidelete.js");
const antiEditPlugin = require("./plugins/antiedit.js");
const autoVoicePlugin = require("./plugins/autovoice.js");
global.pluginHooks.push(antiDeletePlugin);
global.pluginHooks.push(antiEditPlugin); 
global.pluginHooks.push(autoVoicePlugin);

// ====================== SESSION HANDLER ======================
async function ensureSessionFile() {
  if (!fs.existsSync(credsPath)) {
    if (!config.SESSION_ID) {
      console.error("❌ SESSION_ID is missing in config.js");
      process.exit(1);
    }

    console.log("🔄 Downloading session from MEGA…");
    const sess = config.SESSION_ID;
    const file = File.fromURL(`https://mega.nz/file/${sess}`);

    file.download((err, data) => {
      if (err) {
        console.error("❌ Failed to download MEGA session:", err);
        process.exit(1);
      }

      if (!fs.existsSync(path.join(__dirname, "/auth_info_baileys/"))) {
        fs.mkdirSync(path.join(__dirname, "/auth_info_baileys/"), { recursive: true });
      }
      fs.writeFileSync(credsPath, data);

      console.log("✅ Session restored. Starting bot...");
      connectToWA();
    });
  } else {
    connectToWA();
  }
}

// ====================== MAIN WHATSAPP CONNECTION ======================
async function connectToWA() {
  console.log("🔌 Connecting NETHMINA OFC…");

  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, "/auth_info_baileys/")
  );

  const { version } = await fetchLatestBaileysVersion();

  const nethmina = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    auth: state,
    version,
    getNextUnreadMsgGroupLimit: 0,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    shouldSyncHistoryMessage: () => false 
  });

  // ====================== CONNECTION EVENTS ======================
  nethmina.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    }
    if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY");
      const msg = `*🤖 Welcome to NETHMINA OFC WA-BOT 🤖*\n\n⭐ *Bot Started Successfully!*\n🧿 Prefix: [${prefix}]\n\nType *.alive* to check status\nType *.menu* to see commands\n\n> Powered by Nethmina OFC`;
      await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { text: msg });
      
      // Load plugins from folder
      if (fs.existsSync("./plugins/")) {
          fs.readdirSync("./plugins/").forEach((file) => {
            if (file.endsWith(".js")) require(`./plugins/${file}`);
          });
      }
    }
  });

  nethmina.ev.on("creds.update", saveCreds);

  // ====================== CALL HANDLING ======================
  nethmina.ev.on('call', async (call) => {
    try {
        const antiCall = require('./plugins/anticall.js');
        if (antiCall && antiCall.handleCall) {
            await antiCall.handleCall(nethmina, call);
        }
    } catch (e) {}
  });

  // ====================== STATUS & MESSAGE UPSERT ======================
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;

      // --- STATUS BROADCAST HANDLING ---
      if (mek.key.remoteJid === "status@broadcast") {
        if (mek.message?.reactionMessage) return; 

        const senderJid = mek.key.participant || mek.key.remoteJid;
        const body = mek.message?.conversation || mek.message?.extendedTextMessage?.text || "";

        if (config.AUTO_STATUS_SEEN === "true") {
          await nethmina.readMessages([mek.key]).catch(e => {});
        }

        if (config.AUTO_STATUS_REACT === "true") {
          const defaultEmojis = ['❤️', '💖', '🔥', '✨', '💯', '🙌'];
          const reactionEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
          await nethmina.sendMessage("status@broadcast", {
            react: { text: reactionEmoji, key: mek.key }
          }, { statusJidList: [senderJid] }).catch(e => {});
        }
        continue; // Status නම් මෙතනින් නවත්වන්න
      }

      // --- [EDIT DETECTION] ---
      const isEdit = mek.message.protocolMessage && mek.message.protocolMessage.type === 14;
      if (isEdit) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onEdit) await plugin.onEdit(nethmina, mek).catch(e => {});
        }
        continue; 
      }

      // Plugin hooks (onMessage)
      for (const plugin of global.pluginHooks) {
        if (plugin.onMessage) plugin.onMessage(nethmina, mek);
      }

      const from = mek.key.remoteJid;
      const type = getContentType(mek.message);
      const body = type === "conversation" ? mek.message.conversation : 
                   type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                   type === "imageMessage" ? mek.message.imageMessage.caption : 
                   type === "videoMessage" ? mek.message.videoMessage.caption : "";

      const sender = mek.key.fromMe ? nethmina.user.id : mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");

      const reply = (txt) => nethmina.sendMessage(from, { text: txt }, { quoted: mek });
      const isGroup = from.endsWith('@g.us');
      const isMe = mek.key.fromMe;
      const botNumber = nethmina.user.id.split(':')[0] + '@s.whatsapp.net';
      const isOwner = ownerNumber.includes(senderNumber) || isMe;

      // OWNER REACT
      if (isMe && !isCmd && config.OWNER_REACT === 'true') {
        await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } }).catch(e => {});
      }

      // COMMAND EXECUTION
      if (isCmd) {
        if (isOwner) await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } }).catch(e => {});
        const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
        if (cmd) {
          try {
            const quoted = mek.message[type]?.contextInfo?.quotedMessage ? {
                id: mek.message[type].contextInfo.stanzaId,
                sender: mek.message[type].contextInfo.participant,
                fromMe: mek.message[type].contextInfo.participant === botNumber,
                message: mek.message[type].contextInfo.quotedMessage
            } : null;
            await cmd.function(nethmina, mek, sms(nethmina, mek), {
              from, args, q, sender, reply, command: commandName, isGroup, isOwner, quoted
            });
          } catch (e) { console.log("PLUGIN ERROR:", e); }
        }
      }

      // Reply Handlers
      for (const handler of replyHandlers) {
        if (handler.filter(body, { sender, message: mek })) {
          handler.function(nethmina, mek, sms(nethmina, mek), { from, body, sender, reply, isGroup, isOwner });
          break;
        }
      }
    }
  });

  // ====================== DELETE EVENTS ======================
  nethmina.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      for (const plugin of global.pluginHooks) {
        try {
          if (plugin.onDelete && (update.action === 'delete' || update.update?.message === null)) {
            await plugin.onDelete(nethmina, [update]);
          }
        } catch (err) { }
      }
    }
  });

} // connectToWA Function End

ensureSessionFile();
