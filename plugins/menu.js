const { cmd, commands } = require("../command");
const config = require('../config');
const { runtime } = require('../lib/functions');
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

const pendingMenu = {};
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

// Voice Note Convert Logic
const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 64k -vbr on -f ogg "${output}"`, (error) => {
            if (error) reject(error);
            else resolve(output);
        });
    });
};

cmd({
  pattern: "menu",
  react: "📋",
  desc: "Show command categories",
  category: "main",
  filename: __filename
}, async (nethmina, m, msg, { from, sender, pushname, reply }) => {
    try {
        const userPushname = m.pushName || pushname || 'User';
        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

        // 1. Voice Note එක යැවීම (Menu Voice)
        await nethmina.sendPresenceUpdate('recording', from);
        const audioUrl = "https://mp3tourl.com/audio/1778306495613-dd657de1-27aa-44df-aac8-4842a1f39b0d.m4a";
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `menu_${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `menu_${Date.now()}.opus`);

        try {
            const response = await axios({ method: 'get', url: audioUrl, responseType: 'arraybuffer' });
            fs.writeFileSync(inputPath, response.data);
            await convertToOpus(inputPath, outputPath);
            await nethmina.sendMessage(from, { audio: fs.readFileSync(outputPath), mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
        } catch (vError) {
            await nethmina.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
        } finally {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }

        // 2. Video Note එක යැවීම (Menu Video)
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/menuv.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: m });

        // 3. Menu Text එක සකස් කිරීම
        const commandMap = {};
        for (const command of commands) {
            if (command.dontAddCommandList) continue;
            const category = (command.category || "MISC").toUpperCase();
            if (!commandMap[category]) commandMap[category] = [];
            commandMap[category].push(command);
        }

        const categories = Object.keys(commandMap);
        
        let menuCaption = `👋 𝐇𝐄𝐋𝐋𝐎, ${userPushname} 
𝐇𝐄𝐑𝐄 𝐈𝐒 𝐌𝐘 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 👾

╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」
│📅 \`Date\` : ${date}
│⏰ \`Time\` : ${time}
╰──────────●●►

╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 \`User\`: ${userPushname}
│✒️ \`Prefix\` : ${config.PREFIX}
│🧬 \`Version\` : v2.0.0
│📟 \`Uptime\` : ${uptime}
│📂 \`Memory\` : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
╰──────────●●►

*📑 CATEGORIES:*
───────────────────────\n`;

        categories.forEach((cat, i) => {
            const emojiIndex = (i + 1).toString().split("").map(n => numberEmojis[n]).join("");
            menuCaption += `┃ ${emojiIndex} *${cat}* (${commandMap[cat].length})\n`;
        });

        menuCaption += `───────────────────────\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

        // 4. Main Menu Message එක යැවීම (Context Info සහිතව)
        await nethmina.sendMessage(from, { 
            image: { url: config.ALIVE_IMG },
            caption: menuCaption,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363233544482017@newsletter',
                    serverMessageId: 143,
                    newsletterName: 'NETHMINA-OFC-WABOT-V2'
                }
            }
        }, { 
            quoted: {
                key: { remoteJid: 'status@broadcast', fromMe: false, participant: '0@s.whatsapp.net' },
                message: {
                    contactMessage: {
                        displayName: "NETHMINA-OFC ツ",
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;NETHMINA-OFC ツ;;;\nFN:NETHMINA-OFC ツ\nitem1.TEL;waid=94760860835:+94 76 086 0835\nitem1.X-ABLabel:PSTN\nEND:VCARD`
                    }
                }
            }
        });

        pendingMenu[sender] = { step: "category", commandMap, categories };

    } catch (e) {
        console.error(e);
        reply(`*Error:* ${e.message}`);
    }
});

// Category Selection Logic (මෙතන වෙනසක් නෑ)
cmd({
  filter: (text, { sender }) => pendingMenu[sender] && pendingMenu[sender].step === "category" && /^[1-9][0-9]*$/.test(text.trim())
}, async (nethmina, m, msg, { from, body, sender, reply }) => {
  await nethmina.sendMessage(from, { react: { text: "✅", key: m.key } });

  const { commandMap, categories } = pendingMenu[sender];
  const index = parseInt(body.trim()) - 1;
  if (index < 0 || index >= categories.length) return reply("❌ Invalid selection.");

  const selectedCategory = categories[index];
  const cmdsInCategory = commandMap[selectedCategory];

  let cmdText = `*${selectedCategory} COMMANDS*\n\n`;
  cmdsInCategory.forEach(c => {
    const patterns = [c.pattern, ...(c.alias || [])].filter(Boolean).map(p => `.${p}`);
    cmdText += `✨ ${patterns.join(", ")}\n   _${c.desc || "No description"}_\n\n`;
  });
  cmdText += `───────────────────────\n`;
  cmdText += `Total Commands: ${cmdsInCategory.length}\n`;

  await nethmina.sendMessage(from, {
    image: { url: config.ALIVE_IMG },
    caption: cmdText,
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363233544482017@newsletter',
            newsletterName: 'NETHMINA-OFC-WABOT-V2'
        }
    }
  }, { quoted: m });

  delete pendingMenu[sender];
});
