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
const axios = require('axios')
const { exec } = require('child_process');
const config = require("./config");
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
global.pluginHooks.push(antiDeletePlugin);
global.pluginHooks.push(antiEditPlugin); 

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

      fs.mkdirSync(path.join(__dirname, "/auth_info_baileys/"), {
        recursive: true
      });
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
    browser: Browsers.macOS("Safari"),
    auth: state,
    version,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  });

  // ====================== CONNECTION EVENTS ======================
  nethmina.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      if (
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        connectToWA();
      }
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY");

      const msg = `*🤖 Welcome to NETHMINA OFC WA-BOT 🤖*

⭐ *Bot Started Successfully!*
🧿 Prefix: [${prefix}]

Type *.alive* to check status  
Type *.menu* to see commands

> Powered by Nethmina OFC`;

      await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        text: msg
      });

      // Load plugins
      fs.readdirSync("./plugins/").forEach((file) => {
        if (file.endsWith(".js")) require(`./plugins/${file}`);
      });
    }
  });

  nethmina.ev.on("creds.update", saveCreds);

  // ====================== STATUS AUTO SEEN + AUTO REACT + FORWARD ======================
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.remoteJid === "status@broadcast") {
        
        if (msg.message?.reactionMessage) return; 

        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderName = msg.pushName || senderJid.split('@')[0];
        const mentionJid = senderJid.includes("@s.whatsapp.net") ? senderJid : senderJid + "@s.whatsapp.net";
        
        const body = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || "";

        // --- 1. AUTO SEEN ---
        try {
          if (config.AUTO_STATUS_SEEN === "true") {
            await nethmina.readMessages([msg.key]);
          }
        } catch (err) {
          console.error("❌ Status seen error:", err);
        }

        // --- 2. SMART AUTO REACT ---
        try {
          if (config.AUTO_STATUS_REACT === "true") {
            const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
            const foundEmojis = body ? body.match(emojiRegex) : null;
            
            let reactionEmoji;
            if (foundEmojis && foundEmojis.length > 0) {
              reactionEmoji = foundEmojis[0];
            } else {
              const defaultEmojis = ['❤️', '🩷', '🩵', '🩶', '💜', '💙', '💚', '💛', '🧡', '🤍', '🤎', '🖤','💖', '💘', '💝', '💗', '💕', '💞', '💓', '❣️', '💟', '❤️‍🔥', '❤️‍🩹', '🫶', '🫰'];
              reactionEmoji = defaultEmojis[Math.floor(Math.random() * defaultEmojis.length)];
            }

            await nethmina.sendMessage("status@broadcast", {
              react: { text: reactionEmoji, key: msg.key }
            }, { statusJidList: [senderJid] });
          }
        } catch (err) {
          console.error("❌ Status react error:", err);
        }

        // --- 3. FORWARD TEXT STATUS ---
        if (msg.message?.extendedTextMessage && !msg.message.imageMessage && !msg.message.videoMessage) {
          const text = msg.message.extendedTextMessage.text || "";
          if (text.trim().length > 0) {
            try {
              await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
                text: `📝 *Text Status*\n👤 From: *${senderName}*\n\n${text}`,
                mentions: [mentionJid]
              });
            } catch (e) {}
          }
        }

        // --- 4. FORWARD MEDIA STATUS ---
        if (msg.message?.imageMessage || msg.message?.videoMessage) {
          try {
            const msgType = msg.message.imageMessage ? "imageMessage" : "videoMessage";
            const mediaMsg = msg.message[msgType];
            const stream = await downloadContentFromMessage(mediaMsg, msgType === "imageMessage" ? "image" : "video");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
              [msgType === "imageMessage" ? "image" : "video"]: buffer,
              mimetype: mediaMsg.mimetype || (msgType === "imageMessage" ? "image/jpeg" : "video/mp4"),
              caption: `📥 *Forwarded Status*\n👤 From: *${senderName}*\n\n${mediaMsg.caption || ""}`,
              mentions: [mentionJid]
            });
          } catch (err) {}
        }
      }
    }
  });

  // ====================== MAIN MESSAGE HANDLING ======================
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;

      // --- [EDIT DETECTION] ---
      const isEdit = mek.message.protocolMessage && mek.message.protocolMessage.type === 14;
      if (isEdit) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onEdit) {
            await plugin.onEdit(nethmina, mek).catch(e => console.log("Edit Plugin Error:", e));
          }
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

      // ====================== COMMAND PARSING ======================
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");

      const reply = (txt) => nethmina.sendMessage(from, { text: txt }, { quoted: mek });

      const isGroup = from.endsWith('@g.us');
      const isMe = mek.key.fromMe;
      const botNumber = nethmina.user.id.split(':')[0] + '@s.whatsapp.net';
      const isOwner = ownerNumber.includes(senderNumber) || isMe;

      let isAdmins = false;
      let isBotAdmins = false;
      if (isGroup) {
          try {
              const groupMetadata = await nethmina.groupMetadata(from);
              const participants = groupMetadata.participants;
              const user = participants.find(p => p.id === sender);
              isAdmins = user && (user.admin === 'admin' || user.admin === 'superadmin');
              const botInGroup = participants.find(p => p.id === botNumber);
              isBotAdmins = botInGroup && (botInGroup.admin === 'admin' || botInGroup.admin === 'superadmin');
          } catch (e) { }
      }
      
      if (isOwner && isCmd) {
        await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } });
      }

      if (isCmd) {
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
              from, args, q, sender, reply, command: commandName, isGroup, isOwner, isAdmins, isBotAdmins, quoted
            });
          } catch (e) { console.log("PLUGIN ERROR:", e); }
        }
      }

      // Reply Handlers
      for (const handler of replyHandlers) {
        if (handler.filter(body, { sender, message: mek })) {
          handler.function(nethmina, mek, sms(nethmina, mek), {
            from, body, sender, reply, isGroup, isOwner, isAdmins, isBotAdmins
          });
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

} // connectToWA End

ensureSessionFile();
