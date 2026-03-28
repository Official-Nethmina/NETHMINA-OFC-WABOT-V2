// ====================== IMPORTS ======================
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  proto,
  downloadContentFromMessage,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");

const config = require("./config");
const { sms } = require("./lib/msg");
const { getGroupAdmins } = require("./lib/functions");
const { commands, replyHandlers } = require("./command");
const { File } = require("megajs");

// ====================== SERVER ======================
const app = express();
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("NETHMINA-OFC WA-BOT Running Successfully 🚀");
});

app.listen(port, () => console.log(`Server running → http://localhost:${port}`));

// ====================== CONFIG ======================
const prefix = ".";
const ownerNumber = ["94701332157"];
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
    const sessdata = config.SESSION_ID;
    const file = File.fromURL(`https://mega.nz/file/${sessdata}`);

    file.download((err, data) => {
      if (err) {
        console.error("❌ Failed to download MEGA session:", err);
        process.exit(1);
      }

      fs.mkdirSync(path.join(__dirname, "/auth_info_baileys/"), { recursive: true });
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
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
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

  // ====================== MESSAGE HANDLING ======================
  nethmina.ev.on("messages.upsert", async ({ messages }) => {
    for (const mek of messages) {
      if (!mek.message) continue;

      // Run anti-delete ON MESSAGE
      if (global.pluginHooks.length > 0) {
        for (const plugin of global.pluginHooks) {
          if (plugin.onMessage) {
            plugin.onMessage(nethmina, mek);
          }
        }
      }

      const from = mek.key.remoteJid;
      const type = getContentType(mek.message);
      const body =
        type === "conversation"
          ? mek.message.conversation
          : mek.message[type]?.text ||
            mek.message[type]?.caption ||
            "";

      const sender =
        mek.key.fromMe
          ? nethmina.user.id
          : mek.key.participant || mek.key.remoteJid;

      const senderNumber = sender.split("@")[0];
      const isCmd = body.startsWith(prefix);
      const commandName = isCmd ? body.slice(prefix.length).trim().split(" ")[0] : "";
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

      // ===== COMMAND HANDLING =====
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

      // ===== REPLY HANDLERS =====
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
          console.log("onDelete error:", err);
        }
      }
    }
  });
}

// ====================== START BOT ======================
ensureSessionFile();

// ---------------------- EXPRESS SERVER ----------------------
app.get("/", (req, res) => {
  res.send("Hey, NETHMINA-OFC started✅");
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
