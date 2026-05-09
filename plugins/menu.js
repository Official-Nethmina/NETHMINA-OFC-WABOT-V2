const { cmd, commands } = require("../command");
const config = require('../config');
const { runtime } = require('../lib/functions');
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// පෙන්ඩින් මෙගු ටික මතක තියාගන්න (Global variable එකක් විදියට තියන්න)
if (!global.pendingMenu) global.pendingMenu = {};
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

        // 1. Voice Note එක යැවීම
        const audioUrl = "https://mp3tourl.com/audio/1778306495613-dd657de1-27aa-44df-aac8-4842a1f39b0d.m4a";
        try {
            await nethmina.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
        } catch (e) { console.log("Audio Error") }

        // 2. Video Note එක යැවීම
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/menuv.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: m });

        // 3. Menu Text එක සකස් කිරීම
        const commandMap = {};
        commands.forEach(cmd => {
            if (!cmd.dontAddCommandList && cmd.pattern) {
                const category = (cmd.category || "MISC").toUpperCase();
                if (!commandMap[category]) commandMap[category] = [];
                commandMap[category].push(cmd);
            }
        });

        const categories = Object.keys(commandMap).sort();
        
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
╰──────────●●►

*📑 CATEGORIES:*
───────────────────────\n`;

        categories.forEach((cat, i) => {
            menuCaption += `┃ ${(i + 1)} *${cat}* (${commandMap[cat].length})\n`;
        });

        menuCaption += `───────────────────────\n\n> 💡 *Reply with a category number to see commands.*`;

        // 4. Message එක යැවීම
        await nethmina.sendMessage(from, { 
            image: { url: config.ALIVE_IMG },
            caption: menuCaption,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363233544482017@newsletter',
                    newsletterName: 'NETHMINA-OFC-WABOT-V2'
                }
            }
        }, { quoted: m });

        // දත්ත සේව් කිරීම (Number reply එක අඳුරගන්න)
        global.pendingMenu[from] = { 
            sender: sender,
            commandMap: commandMap, 
            categories: categories 
        };

    } catch (e) {
        console.error(e);
        reply(`*Error:* ${e.message}`);
    }
});

// Category selection handling using onMessage hook
cmd({
    onMessage: true
}, async (nethmina, m, msg, { from, body, sender, reply }) => {
    // පෙන්ඩින් මෙගු එකක් තිබේද සහ එවපු කෙනාමද බලනවා
    if (!global.pendingMenu[from] || global.pendingMenu[from].sender !== sender) return;
    
    const input = body.trim();
    // ඉලක්කම් විතරක්ද බලනවා
    if (!/^\d+$/.test(input)) return;

    const { commandMap, categories } = global.pendingMenu[from];
    const index = parseInt(input) - 1;

    if (index >= 0 && index < categories.length) {
        const selectedCategory = categories[index];
        const cmdsInCategory = commandMap[selectedCategory];

        await nethmina.sendMessage(from, { react: { text: "✅", key: m.key } });

        let cmdText = `*${selectedCategory} COMMANDS*\n\n`;
        cmdsInCategory.forEach(c => {
            cmdText += `✨ *.${c.pattern}*\n_${c.desc || "No description"}_\n\n`;
        });
        cmdText += `───────────────────────\n`;
        cmdText += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

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

        // Reply එක දුන්නට පස්සේ pending ලිස්ට් එකෙන් අයින් කරනවා
        delete global.pendingMenu[from];
    }
});
