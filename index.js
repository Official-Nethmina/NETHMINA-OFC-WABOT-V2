// ====================== IMPORTS ======================
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  Browsers,
  jidNormalizedUser
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");
const config = require("./config");
const { sms } = require("./lib/msg");
const { commands, replyHandlers } = require("./command");
const { File } = require("megajs");

// ====================== SERVER ======================
const app = express();
const port = process.env.PORT || 8000;
app.get("/", (req, res) => res.send("NETHMINA-OFC WA-BOT Running Successfully 🚀"));
app.listen(port, () => console.log(`Server running → http://localhost:${port}`));

// ====================== CONFIG ======================
const prefix = ".";
const ownerNumber = ["94760860835"];
const credsPath = path.join(__dirname, "/auth_info_baileys/creds.json");
global.pluginHooks = [];

// ====================== SESSION HANDLER ======================
async function ensureSessionFile() {
  const authFolder = path.join(__dirname, "/auth_info_baileys/");
  
  if (fs.existsSync(authFolder)) {
    console.log("🗑️ Cleaning up old session folder...");
    fs.rmSync(authFolder, { recursive: true, force: true });
  }

  fs.mkdirSync(authFolder, { recursive: true });

  if (!config.SESSION_ID) {
    console.error("❌ SESSION_ID is missing");
    process.exit(1);
  }

  console.log("🔄 Downloading session from MEGA…");
  const file = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);
  
  file.download((err, data) => {
    if (err) {
      console.error("❌ MEGA Download Error:", err);
      process.exit(1);
    }
    
    fs.writeFileSync(credsPath, data);
    console.log("✅ Session downloaded successfully!");
    connectToWA();
  });
}

// ====================== MAIN WHATSAPP CONNECTION ======================
async function connectToWA() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "/auth_info_baileys/"));
  const { version } = await fetchLatestBaileysVersion();

  const nethmina = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu("Chrome"),
    auth: state,
    version,
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

// --- [CONNECTION EVENTS] ---
  nethmina.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) connectToWA();
    } else if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY");

      try {
        const connMsg = `✅ *NETHMINA-OFC BOT CONNECTED*\n\nPrefix: [ ${prefix} ]\nOwner: ${ownerNumber[0]}\n\n_බොට් සාර්ථකව ක්‍රියාත්මක වේ...🚀_`;
        await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { text: connMsg });
      } catch (e) {
        console.log("❌ Error sending connection message:", e);
      }
      if (fs.existsSync("./plugins/")) {
        fs.readdirSync("./plugins/").forEach((file) => {
          if (file.endsWith(".js")) {
            try {
              const plugin = require(`./plugins/${file}`);
              global.pluginHooks.push(plugin);
            } catch (e) {
              console.error(`❌ Error loading plugin ${file}:`, e);
            }
          }
        });
      }
    }
  });

  nethmina.ev.on("creds.update", saveCreds);

  // --- [CALL HANDLING] ---
  nethmina.ev.on('call', async (call) => {
    try {
        const antiCall = require('./plugins/anticall.js');
        if (antiCall && antiCall.handleCall) {
            await antiCall.handleCall(nethmina, call);
        }
    } catch (e) {}
  });

  // --- [DELETE EVENTS IN INDEX.JS] ---
// Edit detection එක upsert එකට ගෙන ගිය නිසා මෙතන තියෙන්නේ Delete එක විතරයි
nethmina.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
        // Message එක Delete කිරීමක්දැයි පරීක්ෂා කිරීම
        if (update.update && update.update.message === null) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onDelete) {
                    try { 
                        await plugin.onDelete(nethmina, update); 
                    } catch (e) { 
                        console.error("Delete Event Error:", e); 
                    }
                }
            }
        }
    }
});

// --- [MESSAGE HANDLING & EDIT DETECTION] ---
nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
        if (!mek.message) continue;

        // 1. [EDIT DETECTION] - මැසේජ් එකක් Edit කළ විට එය හඳුනා ගැනීම
        const isEdit = mek.message.protocolMessage && mek.message.protocolMessage.type === 14;
        if (isEdit) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onEdit) {
                    try { 
                        await plugin.onEdit(nethmina, mek); 
                    } catch (e) { 
                        console.error("Plugin onEdit Error:", e);
                    }
                }
            }
            continue; // Edit එකක් නම් සාමාන්‍ය මැසේජ් එකක් විදියට පල්ලෙහාට යන්න දෙන්න එපා
        }

        // 2. Anti-Delete/Edit සඳහා සාමාන්‍ය මැසේජ් එක ස්ටෝර් කිරීම
        for (const plugin of global.pluginHooks) {
            if (plugin.onMessage) {
                try { 
                    await plugin.onMessage(nethmina, mek); 
                } catch (e) {}
            }
        }

        // --- සාමාන්‍ය මැසේජ් සැකසීම ---
        const from = mek.key.remoteJid;
        const type = getContentType(mek.message);
        const isStatus = from === "status@broadcast";
        const botNumber = jidNormalizedUser(nethmina.user.id);
        const sender = isStatus ? (mek.key.participant || from) : (mek.key.fromMe ? botNumber : (mek.key.participant || from));
        const senderNumber = sender.split("@")[0];
        const senderName = mek.pushName || "Unknown";

        const body = type === "conversation" ? mek.message.conversation : 
                     type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                     type === "imageMessage" ? mek.message.imageMessage.caption : 
                     type === "videoMessage" ? mek.message.videoMessage.caption : "";

        // --- [STATUS HANDLING] ---
        if (isStatus) {
        if (mek.message?.reactionMessage) return;

        try {
          if (config.AUTO_STATUS_SEEN === "true") {
            await nethmina.readMessages([mek.key]);
          }
        } catch (err) { console.error("❌ Status seen error:", err); }

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
            await nethmina.sendMessage("status@broadcast", { react: { text: reactionEmoji, key: mek.key } }, { statusJidList: [sender] });
          }
        } catch (err) { console.error("❌ Status react error:", err); }

        if (config.FORWARD_STATUS === "true") {
            const targetNumber = ownerNumber[0] + "@s.whatsapp.net";

            if (type === "extendedTextMessage") {
                const statusText = mek.message.extendedTextMessage.text || "";
                if (statusText.trim()) {
                    await nethmina.sendMessage(targetNumber, {
                        text: `📝 *Text Status Forwarded*\n\n👤 *From:* ${senderName}\n🔢 *Number:* ${senderNumber}\n\n${statusText}`
                    });
                }
            } 
            else if (type === "imageMessage" || type === "videoMessage") {
                try {
                    const msgType = type === "imageMessage" ? "image" : "video";
                    const media = mek.message[type];
                    const stream = await downloadContentFromMessage(media, msgType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    await nethmina.sendMessage(targetNumber, {
                        [msgType]: buffer,
                        mimetype: media.mimetype,
                        caption: `📥 *Media Status Forwarded*\n\n👤 *From:* ${senderName}\n🔢 *Number:* ${senderNumber}\n\n${media.caption || ""}`
                    });
                } catch (err) {
                    console.error("❌ Status Media Forward Error:", err);
                }
            }
        }
        continue;
      }

      // --- [VIEW ONCE AUTO RETRIEVE] ---
      if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          const quoted = mek.message.extendedTextMessage.contextInfo.quotedMessage;
          const mtype = Object.keys(quoted)[0];
          if (quoted[mtype]?.viewOnce) {
              const isMyMessage = sender.includes("94760860835");
              if (isMyMessage) {
                  try {
                      const mediaMsg = quoted[mtype];
                      const stream = await downloadContentFromMessage(
                          mediaMsg,
                          mtype === "imageMessage" ? "image" : mtype === "videoMessage" ? "video" : "audio"
                      );
                      let buffer = Buffer.from([]);
                      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

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

                      if (Object.keys(messageContent).length > 0) {
                          await nethmina.sendMessage(targetJid, messageContent);
                      }
                  } catch (e) { console.log("❌ View Once Process Error:", e); }
              }
          }
      }

      // --- [COMMANDS & OWNER REACT] ---
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");
      const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe;
      const reply = (txt) => nethmina.sendMessage(from, { text: txt }, { quoted: mek });

      if (isOwner && !isCmd && config.OWNER_REACT === "true") {
        await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } }).catch(() => {});
      }

      if (isCmd) {
        const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
        if (cmd) {
          if (isOwner) await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } }).catch(() => {});
          try {
            await cmd.function(nethmina, mek, sms(nethmina, mek), { from, args, q, sender, reply, isOwner, isGroup: from.endsWith('@g.us'), botNumber });
          } catch (e) { console.error(e); }
        }
      }
    }
  });
}

ensureSessionFile();
