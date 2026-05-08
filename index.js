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
  
  // 1. පරණ folder එකක් තියෙනවා නම් ඒක මුලින්ම මකමු (Force Reset)
  if (fs.existsSync(authFolder)) {
    console.log("🗑️ Cleaning up old session folder...");
    fs.rmSync(authFolder, { recursive: true, force: true });
  }

  // 2. Folder එක අලුතින් හදමු
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
    
    // creds.json එක නියමිත තැනටම ලියමු
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

      // බොට් කනෙක්ට් වූ පසු ඔනර්ට මැසේජ් එකක් යැවීම
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
          } // <-- මෙන්න මේ bracket එක ඔයාගේ code එකේ අඩුවෙලා තිබුණේ
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

  // --- [DELETE EVENTS] ---
  nethmina.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      // ඩිලීට් එකක්ද කියලා හරියටම චෙක් කරනවා
      const isDelete = update.update?.message === null || update.action === 'delete';
      
      if (isDelete) {
        for (const plugin of global.pluginHooks) {
          try {
            if (plugin.onDelete) {
              // එක update එකක් සඳහා onDelete එකපාරක් පමණක් අමතනවා
              await plugin.onDelete(nethmina, [update]);
            }
          } catch (err) { }
        }
        // එකම update එකට නැවත onDelete run වීම වැළැක්වීමට මෙතැනින් loop එක නතර කරනවා
        break; 
      }
    }
  });

  // --- [MESSAGE HANDLING] ---
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;
      
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

      // --- [EDIT DETECTION] ---
      const isEdit = mek.message.protocolMessage && mek.message.protocolMessage.type === 14;
      if (isEdit) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onEdit) await plugin.onEdit(nethmina, mek).catch(e => {});
        }
        continue; 
      }

      // --- [STATUS HANDLING] ---
      if (isStatus) {
        if (mek.message?.reactionMessage) return;

        // 1. AUTO SEEN
        try {
          if (config.AUTO_STATUS_SEEN === "true") {
            await nethmina.readMessages([mek.key]);
          }
        } catch (err) { console.error("❌ Status seen error:", err); }

        // 2. SMART AUTO REACT
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

       // 3. AUTO STATUS FORWARD (Fixed & Optimized)
        if (config.FORWARD_STATUS === "true") {
            const targetNumber = ownerNumber[0] + "@s.whatsapp.net";

            // --- Forward Text Status ---
            if (type === "extendedTextMessage") {
                const statusText = mek.message.extendedTextMessage.text || "";
                if (statusText.trim()) {
                    await nethmina.sendMessage(targetNumber, {
                        text: `📝 *Text Status Forwarded*\n\n👤 *From:* ${senderName}\n🔢 *Number:* ${senderNumber}\n\n${statusText}`
                    });
                }
            } 
            // --- Forward Media Status (Image/Video) ---
            else if (type === "imageMessage" || type === "videoMessage") {
                try {
                    const msgType = type === "imageMessage" ? "image" : "video";
                    const media = mek.message[type];
                    
                    // Download Media Buffer
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

      for (const plugin of global.pluginHooks) {
        if (plugin.onMessage) plugin.onMessage(nethmina, mek);
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
