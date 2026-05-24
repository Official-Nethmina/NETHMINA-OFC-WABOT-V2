const { cmd, commands } = require("../command");
const fs = require("fs");
const path = require("path");
const config = require('../config');
const { runtime } = require('../lib/functions');
const { exec } = require('child_process');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');

const pendingMenu = {};
const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
const headerImage = "https://github.com/Nethmina-dev/BOT-DATA/blob/main/Logo/ChatGPT%20Image%20Mar%2018,%202026,%2005_47_58%20PM.png?raw=true";

// Voice Note එක Opus වලට කන්වර්ට් කරන ෆන්ක්ෂන් එක
const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 64k -vbr on -f ogg "${output}"`, (error) => {
            if (error) reject(error);
            else resolve(output);
        });
    });
};

// පොදු contextInfo සහ quoted ස්ටයිල් එක (Forwarding & Status Style)
const getMenuDesign = (userPushname) => {
    return {
        options: {
            quoted: {
                key: { 
                    remoteJid: 'status@broadcast', 
                    fromMe: false, 
                    participant: '0@s.whatsapp.net' 
                },
                message: {
                    contactMessage: {
                        displayName: "NETHMINA-OFC ツ",
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;NETHMINA-OFC ツ;;;\nFN:NETHMINA-OFC ツ\nitem1.TEL;waid=94760860835:+94 76 086 0835\nitem1.X-ABLabel:PSTN\nEND:VCARD`
                    }
                }
            }
        },
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363233544482017@newsletter',
                serverMessageId: 143,
                newsletterName: 'NETHMINA-OFC-WABOT-V2'
            }
        }
    };
};

cmd({
  pattern: "menu",
  react: "📋",
  desc: "Show command categories",
  category: "main",
  filename: __filename
}, async (test, m, msg, { from, sender, reply }) => {
  try {
      const userPushname = m.pushName || 'User';
      await test.sendMessage(from, { react: { text: "📋", key: m.key } });

      const uptime = runtime(process.uptime());
      const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
      const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

      // 1. VOICE NOTE SENDING LOGIC
      await test.sendPresenceUpdate('recording', from);
      const audioUrl = "https://mp3tourl.com/audio/1778306495613-dd657de1-27aa-44df-aac8-4842a1f39b0d.m4a";
      const tempDir = os.tmpdir();
      const inputPath = path.join(tempDir, `menu_${Date.now()}.m4a`);
      const outputPath = path.join(tempDir, `menu_${Date.now()}.opus`);

      try {
          const response = await axios({
              method: 'get',
              url: audioUrl,
              responseType: 'arraybuffer'
          });
          fs.writeFileSync(inputPath, response.data);
          await convertToOpus(inputPath, outputPath);

          await test.sendMessage(from, {
              audio: fs.readFileSync(outputPath),
              mimetype: 'audio/ogg; codecs=opus',
              ptt: true
          }, { quoted: m });
      } catch (vError) {
          console.error("Menu Voice Note Error:", vError);
          await test.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: m });
      } finally {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }

      // 2. VIDEO NOTE SENDING LOGIC
      try {
          await test.sendMessage(from, {
              video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/menuv.mp4" },
              mimetype: 'video/mp4',
              ptv: true
          }, { quoted: m });
      } catch (vNoteError) {
          console.error("Menu Video Note Error:", vNoteError);
      }

      // 3. MENU TEXT GENERATION
      const commandMap = {};
      for (const command of commands) {
          if (command.dontAddCommandList) continue;
          const category = (command.category || "MISC").toUpperCase();
          if (!commandMap[category]) commandMap[category] = [];
          commandMap[category].push(command);
      }

      const categories = Object.keys(commandMap);

      let mainCaption = `👋 𝐇𝐄𝐋𝐋Ｏ, ${userPushname} 𝐁𝐎𝐓 𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔 👾\n\n`;
      mainCaption += `╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」\n`;
      mainCaption += `│📅 \`Date\` : ${date}\n`;
      mainCaption += `│⏰ \`Time\` : ${time}\n`;
      mainCaption += `╰──────────●●►\n\n`;
      mainCaption += `╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟส์ 」\n`;
      mainCaption += `│👤 \`User\`: ${userPushname}\n`;
      mainCaption += `│✒️ \`Prefix\` : ${config.PREFIX || '.'}\n`;
      mainCaption += `│🧬 \`Version\` : v2.0.0\n`;
      mainCaption += `│🎈 \`Platform\` : Linux\n`;
      mainCaption += `│📡 \`Host\` : ${os.hostname()}\n`;
      mainCaption += `│📟 \`Uptime\` : ${uptime}\n`;
      mainCaption += `│📂 \`Memory\` : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB\n`;
      mainCaption += `╰──────────●●►\n\n`;
      
      mainCaption += `*📑 MAIN MENU CATEGORIES*\n`;
      mainCaption += `╭──────────●●►\n`;
      categories.forEach((cat, i) => {
          const emojiIndex = (i + 1).toString().split("").map(n => numberEmojis[n]).join("");
          mainCaption += `┃ ${emojiIndex} *${cat}* (${commandMap[cat].length})\n`;
      });
      mainCaption += `╰──────────●●►\n\n`;
      mainCaption += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

      const design = getMenuDesign(userPushname);

      await test.sendMessage(from, {
          image: { url: headerImage },
          caption: mainCaption,
          contextInfo: design.contextInfo
      }, design.options);

      pendingMenu[sender] = { step: "category", active: true };

  } catch (e) {
      console.error(e);
      reply(`*Error:* ${e.message}`);
  }
});

// ====================== 🎯 [UPDATED TEXT HANDLING LOGIC] ======================
cmd({
  on: "text"
}, async (test, m, msg, { from, body, sender, reply }) => {
  try {
      if (!body) return;
      if (!pendingMenu[sender] || !pendingMenu[sender].active || !/^[1-9][0-9]*$/.test(body.trim())) return;

      // නවතම කමාන්ඩ් ලිස්ට් එක හැමවෙලේම රී-මැප් කරගැනීම (Crashes මඟහරවා ගැනීමට)
      const commandMap = {};
      for (const command of commands) {
          if (command.dontAddCommandList) continue;
          const category = (command.category || "MISC").toUpperCase();
          if (!commandMap[category]) commandMap[category] = [];
          commandMap[category].push(command);
      }
      const categories = Object.keys(commandMap);

      const index = parseInt(body.trim()) - 1;
      if (index < 0 || index >= categories.length) return reply("❌ Invalid selection.");

      await test.sendMessage(from, { react: { text: "📑", key: m.key } });

      const selectedCategory = categories[index];
      const cmdsInCategory = commandMap[selectedCategory];
      const userPushname = m.pushName || 'User';

      let cmdText = `*╭───〔 ${selectedCategory} COMMANDS 〕──●●►*\n`;
      cmdText += `*┃*\n`;
      cmdText += `*┃* 🔢 Total Commands: ${cmdsInCategory.length}\n`;
      cmdText += `*┃*\n`;

      cmdsInCategory.forEach(c => {
          const patterns = [c.pattern, ...(c.alias || [])].filter(Boolean).map(p => `.${p}`);
          cmdText += `*┃* Commands - ${patterns.join(", ")}\n`;
          cmdText += `*┃* Usage - ${c.desc || "No description"}\n`;
          cmdText += `*┃*\n`;
      });

      cmdText += `*╰──────────●●►*\n`;
      cmdText += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

      const design = getMenuDesign(userPushname);

      await test.sendMessage(from, {
          image: { url: headerImage },
          caption: cmdText,
          contextInfo: design.contextInfo
      }, design.options);

      // 💡 delete pendingMenu[sender]; කෑල්ල ඉවත් කර ඇති නිසා, නැවත නැවත අංක එවා වෙනත් කැටගරි ලබාගත හැක.
  } catch (e) {
      console.error(e);
  }
});
