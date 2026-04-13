const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const fs = require('fs');
const path = require('path');
const os = require('os');

cmd({
    pattern: "alive",
    desc: "Check bot online status",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, reply }) => {
    try {
        const pushname = m.pushName || 'User';
        await nethmina.sendMessage(from, { react: { text: "🎃", key: m.key } });

        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

       
        await nethmina.sendPresenceUpdate('recording', from);
        await nethmina.sendMessage(from, { 
            audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

        
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // 4. Alive Message Caption (Monospace Fixed)
        const userNumber = m.sender.split('@')[0];
let mainCaption = `👋  𝐇𝐄𝐋𝐋𝐎, ${m.pushname || 'User'} 𝐈❜𝐀𝐌 𝐀𝐋𝐈𝐕𝐄 𝐍𝐎𝐖 👾

╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」
│📅 \`Date\` : ${date}
│⏰ \`Time\` : ${time}
╰──────────●●►

╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 User: @${userNumber}
│✒️ \`Prefix\` : ${config.PREFIX}
│🧬 \`Version\` : v2.0.0
│🎈 \`Platform\` : Linux
│📡 \`Host\` : ${os.hostname()}
│📟 \`Uptime\` : ${uptime}
│📂 \`Memory\` : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
╰──────────●●►

╭─「 ᴍᴀɪɴ ᴄᴏᴍᴍᴀɴᴅꜱ 」
│ 💡 Some commands you can use:  
│ 🔸 \`.menu\`
│ 🔸 \`.alive\`
│ 🔸 \`.system\`
╰──────────●●►

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

       
        return await nethmina.sendMessage(from, { 
            image: { url: config.ALIVE_IMG },
            caption: mainCaption,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363233544482017@newsletter',
                    serverMessageId: 143
                }
                
            }
        }, { 
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
        });

    } catch (e) {
        console.error(e);
        reply(`Error: ${e}`);
    }
});
