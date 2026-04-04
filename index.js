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
global.pluginHooks.push(antiDeletePlugin);

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
      
      // 🚨 මේ පේළිය අනිවාර්යයෙන්ම තියෙන්න ඕනේ loop එක නවත්තන්න
      if (msg.message?.reactionMessage) return; 

      const senderJid = msg.key.participant || msg.key.remoteJid;
      const senderName = msg.pushName || senderJid.split('@')[0];
      const mentionJid = senderJid.includes("@s.whatsapp.net") ? senderJid : senderJid + "@s.whatsapp.net";
      
      const body = msg.message?.conversation || 
                   msg.message?.extendedTextMessage?.text || 
                   msg.message?.imageMessage?.caption || 
                   msg.message?.videoMessage?.caption || "";

      // ... (ඉතිරි code එක කලින් වගේම තියන්න)

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
  // ====================== MESSAGE HANDLING ======================
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;

      // Plugin hooks
      for (const plugin of global.pluginHooks) {
        if (plugin.onMessage) plugin.onMessage(nethmina, mek);
      }

      const from = mek.key.remoteJid;
      const type = getContentType(mek.message);

      const body =
        type === "conversation"
          ? mek.message.conversation
          : mek.message[type]?.text ||
            mek.message[type]?.caption ||
            "";

      const sender = mek.key.fromMe
        ? nethmina.user.id
        : mek.key.participant || mek.key.remoteJid;

      const senderNumber = sender.split("@")[0];

     // ====================== VIEW ONCE AUTO RETRIEVE (FINAL FIX) ======================
      if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          const quoted = mek.message.extendedTextMessage.contextInfo.quotedMessage;
          const mtype = Object.keys(quoted)[0];
          
          // 1. View Once ද කියා පරීක්ෂා කිරීම
          if (quoted[mtype]?.viewOnce) {
              
              // 2. එවූ පුද්ගලයා Owner ද කියා පරීක්ෂා කිරීම (නම්බර් එක කෙලින්ම පරීක්ෂා කරයි)
              const isMyMessage = sender.includes("94760860835");

              if (isMyMessage) {
                  try {
                      const mediaMsg = quoted[mtype];
                      
                      // Media එක download කිරීම
                      const stream = await downloadContentFromMessage(
                          mediaMsg,
                          mtype === "imageMessage" ? "image" : mtype === "videoMessage" ? "video" : "audio"
                      );
                      
                      let buffer = Buffer.from([]);
                      for await (const chunk of stream) {
                          buffer = Buffer.concat([buffer, chunk]);
                      }

                      // මැසේජ් එක යැවිය යුතු Target (ඔයාගේ Inbox)
                      const targetJid = "94760860835@s.whatsapp.net";
                      const captionText = `📥 *View Once Retrieved*\n👤 From Chat: ${from}\n📝 Caption: ${mediaMsg.caption || "No caption"}`;

                      let messageContent = {};
                      if (mtype === "imageMessage") {
                          messageContent = { image: buffer, caption: captionText, mimetype: mediaMsg.mimetype || "image/jpeg" };
                      } else if (mtype === "videoMessage") {
                          messageContent = { video: buffer, caption: captionText, mimetype: mediaMsg.mimetype || "video/mp4" };
                      } else if (mtype === "audioMessage") {
                          messageContent = { audio: buffer, mimetype: mediaMsg.mimetype || "audio/mp4", ptt: mediaMsg.ptt || false };
                      }

                      // 3. කෙලින්ම ඔයාගේ Inbox එකට යැවීම
                      if (Object.keys(messageContent).length > 0) {
                          await nethmina.sendMessage(targetJid, messageContent);
                          console.log("✅ View once successfully sent to Owner!");
                      }
                  } catch (e) {
                      console.log("❌ View Once Process Error:", e);
                  }
              }
          }
      }

      //===============================================================================================
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd
        ? body.slice(prefix.length).trim().split(" ")[0]
        : "";

      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");

      const reply = (txt) =>
        nethmina.sendMessage(from, { text: txt }, { quoted: mek });

      // Auto-react for owner
      if (ownerNumber.includes(senderNumber)) {
        await nethmina.sendMessage(from, {
          react: { text: "🧑🏻‍💻", key: mek.key }
        });
      }

      // COMMAND HANDLER
      if (isCmd) {
        const cmd = commands.find(
          (c) =>
            c.pattern === commandName ||
            (c.alias && c.alias.includes(commandName))
        );

        if (cmd) {
          try {
            await cmd.function(nethmina, mek, sms(nethmina, mek), {
              from,
              args,
              q,
              sender,
              reply,
              command: commandName
            });
          } catch (e) {
            console.log("PLUGIN ERROR:", e);
          }
        }
      }

      // REPLY HANDLERS
      for (const handler of replyHandlers) {
        if (handler.filter(body, { sender, message: mek })) {
          handler.function(nethmina, mek, sms(nethmina, mek), {
            from,
            body,
            sender,
            reply
          });
          break;
        }
      }
    }
  });

  // ====================== MESSAGE DELETE EVENT ======================
  nethmina.ev.on("messages.update", async (updates) => {
    for (const plugin of global.pluginHooks) {
      if (plugin.onDelete) {
        try {
          await plugin.onDelete(nethmina, updates);
        } catch (err) {
          console.log("❌ onDelete error:", err);
        }
      }
    }
  });
}

// ====================== START BOT ======================
ensureSessionFile();
