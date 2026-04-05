const { cmd } = require('../command');
const config = require('../config');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { runtime } = require('../lib/functions');

// Temp directory setup
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

cmd({
    pattern: "alive",
    react: "🎃",
    desc: "Alive message with voice, video note and status reply.",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        // 1. Reaction
        await conn.sendMessage(from, { react: { text: "🎃", key: m.key } });

        // 2. Voice Note (Conversion Logic)
        const audioUrl = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3";
        const outputOgg = path.join(tempDir, `voice_${Date.now()}.ogg`);

        const convertAudio = (url, out) => {
            return new Promise((resolve, reject) => {
                ffmpeg(url)
                    .audioCodec('libopus')
                    .audioBitrate('16k')
                    .format('ogg')
                    .on('end', () => resolve(out))
                    .on('error', (err) => reject(err))
                    .save(out);
            });
        };

        try {
            await convertAudio(audioUrl, outputOgg);
            await conn.sendMessage(from, { 
                audio: fs.readFileSync(outputOgg), 
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true 
            }, { quoted: mek });
            if (fs.existsSync(outputOgg)) fs.unlinkSync(outputOgg);
        } catch (err) {
            console.error("Audio Error:", err);
        }

        // 3. Video Note (PTV)
        await conn.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // 4. Final Alive Message with Status Reply
        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB');
        const time = new Date().toLocaleTimeString('en-US', { hour12: true });

        let aliveMsg = `👋 *HELLOW*, *${pushname}*

*╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」──●●►*
*│*📅 Date : ${date}      
*│*🕒 Time : ${time}
*╰──────────●●►*

*╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」──●●►*
*│*👤 User : ${pushname}
*│*🧑‍💻 Owner : ${config.OWNER_NAME || "Nethmina Ofc"} 
*│*✒️ Prefix : ${config.PREFIX}
*│*🧬 Version : V 01
*│*📟 Uptime : ${uptime}
*╰──────────●●►*

🔢 *REPLY THE NUMBER BELLOW* 01 ❯❯◦ COMMANDS MENU
02 ❯❯◦ CHECK BOT PING

*POWERED BY NETHMINA 〽️D ㋡*`;

        return await conn.sendMessage(from, { 
            image: { url: config.ALIVE_IMG }, 
            caption: aliveMsg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: `HELLO THERE I'M ALIVE NOW 🎀`,
                    body: `NETHMINA-OFC-WA-BOT V1 🍒`,
                    mediaType: 1,
                    sourceUrl: "https://github.com/nethmina-ofc",
                    thumbnailUrl: config.ALIVE_IMG,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: {
            key: { remoteJid: 'status@broadcast', fromMe: false, participant: '0@s.whatsapp.net' },
            message: { extendedTextMessage: { text: "NETHMINA OFC AUTO SVC ID 719" } }
        }});

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
