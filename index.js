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
global.workType = global.workType || config.WORK_TYPE || "all";

// --- [PLUGIN LOADER] ---
const loadPlugins = () => {
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
};
loadPlugins();

// ====================== SESSION HANDLER ======================
async function ensureSessionFile() {
  const authFolder = path.join(__dirname, "/auth_info_baileys/");
  if (fs.existsSync(authFolder)) {
    fs.rmSync(authFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(authFolder, { recursive: true });

  if (!config.SESSION_ID) {
    console.error("❌ SESSION_ID is missing");
    process.exit(1);
  }

  const file = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);
  file.download((err, data) => {
    if (err) { process.exit(1); }
    fs.writeFileSync(credsPath, data);
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

  nethmina.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) connectToWA();
    } else if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY");
      try {
        const connMsg = `✅ *NETHMINA-OFC BOT CONNECTED*\n\nWork Mode: ${global.workType.toUpperCase()}\nPrefix: [ ${prefix} ]\nOwner: ${ownerNumber[0]}`;
        await nethmina.sendMessage(ownerNumber[0] + "@s.whatsapp.net", { text: connMsg });
      } catch (e) {}
    }
  });

  nethmina.ev.on("creds.update", saveCreds);

  // --- [CALL HANDLING] ---
  nethmina.ev.on('call', async (call) => {
    try {
        const antiCall = require('./plugins/anticall.js');
        if (antiCall && antiCall.handleCall) await antiCall.handleCall(nethmina, call);
    } catch (e) {}
  });

  // --- [DELETE & EDIT DETECTION] ---
  // --- [DELETE & EDIT DETECTION] ---
  nethmina.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
        if (!update.key) continue;
        
        const from = update.key.remoteJid;
        if (!from) continue;
        
        const isGroup = from.endsWith('@g.us');
        
        // WorkType අනුව Report එක යවන ස්ථානය තීරණය කිරීම
        let reportTarget = from;
        if (global.workType !== "all" && global.workType !== "group" && isGroup) {
            reportTarget = ownerNumber[0] + "@s.whatsapp.net";
        }

        // 1. Delete Detection ලොජික් එක
        if (update.update && update.update.message === null) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onDelete) try { await plugin.onDelete(nethmina, update, reportTarget); } catch (e) {}
            }
        }
        
        // 2. Edit Detection ලොජික් එක
        if (update.update) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onEdit) {
                    try { 
                        // මුළු update object එකම antiedit එකට පාස් කරනවා
                        await plugin.onEdit(nethmina, update, reportTarget); 
                    } catch (e) {}
                }
            }
        }
    }
  });
  
  // --- [MESSAGE HANDLING] ---
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
        if (!mek.message) continue;

        // Message එක Store කිරීම
        for (const plugin of global.pluginHooks) {
            if (plugin.onMessage) try { await plugin.onMessage(nethmina, mek); } catch (e) {}
        }

        const from = mek.key.remoteJid;
        const type = getContentType(mek.message);
        const isStatus = from === "status@broadcast";
        const botNumber = jidNormalizedUser(nethmina.user.id);
        const sender = isStatus ? (mek.key.participant || from) : (mek.key.fromMe ? botNumber : (mek.key.participant || from));
        const senderNumber = sender.split("@")[0];
        
        const body = type === "conversation" ? mek.message.conversation : 
                     type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                     type === "imageMessage" ? mek.message.imageMessage.caption : 
                     type === "videoMessage" ? mek.message.videoMessage.caption : "";

        const isOwner = ownerNumber.includes(senderNumber) || mek.key.fromMe;
        const isGroup = from.endsWith('@g.us');

        // --- [WORK TYPE LOGIC] ---
        const currentWorkType = (global.workType || config.WORK_TYPE || "all").toLowerCase();
        
        let canWork = false;

        if (isOwner) {
            canWork = true;
        } else {
            if (currentWorkType === "all") {
                canWork = true;
            } else if (currentWorkType === "inbox") {
                if (!isGroup) canWork = true;
            } else if (currentWorkType === "group") {
                if (isGroup) canWork = true;
            } else if (currentWorkType === "private") {
                canWork = false;
            }
        }
      
        if (isStatus) {
            if (mek.message?.reactionMessage) continue;

            try {
              if (config.AUTO_STATUS_SEEN === "true") {
                await nethmina.readMessages([mek.key]);
              }
            } catch (err) {}

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
            } catch (err) {}

            if (config.FORWARD_STATUS === "true") {
                const targetNumber = ownerNumber[0] + "@s.whatsapp.net";
                const pushName = mek.pushName || "User";
                const mentionTag = `@${sender.split('@')[0]}`;

                if (type === "extendedTextMessage") {
                    const statusText = mek.message.extendedTextMessage.text || "";
                    if (statusText.trim()) {
                        await nethmina.sendMessage(targetNumber, { 
                            text: `📝 *Text Status Forwarded*\n\n👤 *From:* ${pushName} ( ${mentionTag} )\n\n${statusText}`,
                            mentions: [sender]
                        });
                    }
                } 
                else if (type === "imageMessage" || type === "videoMessage") {
                    try {
                        const msgType = type === "imageMessage" ? "image" : "video";
                        const media = mek.message[type];
                        const stream = await downloadContentFromMessage(media, msgType);
                        let buffer = Buffer.from([]);
                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                        await nethmina.sendMessage(targetNumber, {
                            [msgType]: buffer,
                            mimetype: media.mimetype,
                            caption: `📥 *Media Status Forwarded*\n\n👤 *From:* ${pushName} ( ${mentionTag} )`,
                            mentions: [sender]
                        });
                    } catch (err) {}
                }
            }
            continue; 
        }

        // --- [AUTO VOICE & OTHER FEATURES] ---
        if (canWork) {
            for (const plugin of global.pluginHooks) {
                if (plugin.onChat) try { await plugin.onChat(nethmina, mek, body); } catch (e) {}
            }
        }

        // --- [COMMAND HANDLING] ---
        const isCmd = body.startsWith(prefix);
        const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);
        const q = args.join(" ");
        const reply = (txt) => nethmina.sendMessage(from, { text: txt }, { quoted: mek });

        if (isCmd) {
            if (commandName === "worktype" || commandName === "mode") {
                // Allow control commands to pass through
            } else if (!canWork) {
                return; 
            }

            const cmd = commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));
            if (cmd) {
                if (isOwner && config.OWNER_REACT === "true") await nethmina.sendMessage(from, { react: { text: "🧑🏻‍💻", key: mek.key } }).catch(() => {});
                try {
                    await cmd.function(nethmina, mek, sms(nethmina, mek), { from, args, q, sender, reply, isOwner, isGroup, botNumber });
                } catch (e) { console.error(e); }
            }
        }
    }
  });
}

ensureSessionFile();
