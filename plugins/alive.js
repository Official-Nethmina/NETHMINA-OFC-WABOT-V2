const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');

const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 64k -vbr on -f ogg "${output}"`, (error) => {
            if (error) reject(error);
            else resolve(output);
        });
    });
};

cmd({
    pattern: "alive",
    desc: "Check bot online status",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, pushname, reply, }) => {
    try {
        
        await nethmina.sendMessage(from, { react: { text: "🎃", key: m.key } });

        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

        await nethmina.sendPresenceUpdate('recording', from);
        
        const audioUrl = "https://saviya-kolla-database.koyeb.app/AUDIO/SAVIYA_1777732918037_twv9lv.mp3";
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `alive_${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `alive_${Date.now()}.opus`);

        try {
           
            const response = await axios({
                method: 'get',
                url: audioUrl,
                responseType: 'arraybuffer'
            });
            fs.writeFileSync(inputPath, response.data);
         
            await convertToOpus(inputPath, outputPath);
 
            await nethmina.sendMessage(from, {
                audio: fs.readFileSync(outputPath),
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: mek });

        } catch (vError) {
            console.error("Voice Note Error:", vError);
            
            await nethmina.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek });
        } finally {
            
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }

       
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });
        
        
        let mainCaption = `👋 𝐇𝐄𝐋𝐋𝐎, ${userPushname} 𝐈❜𝐀𝐌 𝐀𝐋𝐈𝐕𝐄 𝐍𝐎𝐖 👾

╭─「 ᴅᴀᴛᴇ ɪɴꜰᅩʀᴍᴀᴛɪᴏɴ 」
│📅 \`Date\` : ${date}
│⏰ \`Time\` : ${time}
╰──────────●●►

╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 \`User\`: ${userPushname}
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

        await nethmina.sendMessage(from, { 
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
        reply(`*Error:* ${e.message}`);
    }
});

// ===============================================================================================================================
    
cmd({
    pattern: "alive2",
    desc: "Check bot online status",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, pushname, reply }) => {
    try {
        const userPushname = m.pushName || 'User';
        await nethmina.sendMessage(from, { react: { text: "🦋", key: m.key } });

        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

        await nethmina.sendPresenceUpdate('recording', from);
        
        const audioUrl = "https://mp3tourl.com/audio/1777817542904-12f4250b-fb48-4a97-ac7f-7ef9d0aa5564.m4a";
        const tempMp3 = path.join(os.tmpdir(), `temp_${Date.now()}.mp3`);
        const tempOpus = path.join(os.tmpdir(), `temp_${Date.now()}.opus`);

        try {
            const response = await axios({ url: audioUrl, responseType: 'arraybuffer' });
            fs.writeFileSync(tempMp3, response.data);

            const { execSync } = require('child_process');
            execSync(`"${ffmpegPath}" -i ${tempMp3} -c:a libopus -ac 1 -ar 48000 -b:a 12k -application voip ${tempOpus}`);

            if (fs.existsSync(tempOpus)) {
                const audioBuffer = fs.readFileSync(tempOpus);
                await nethmina.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: mek });
            } else {
                throw new Error("Conversion failed");
            }
        } catch (vnError) {
            console.log("FFmpeg error or skip:", vnError.message);
           
            await nethmina.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: mek });
        } finally {
        
            if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
            if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);
        }

        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // --- Alive Message Text ---
        let mainCaption = `👋 𝐇𝐄𝐋𝐋𝐎, ${userPushname} 𝐈❜𝐀𝐌 𝐀𝐋𝐈𝐕𝐄 𝐍𝐎𝐖 👾

╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」
│📅 \`Date\` : ${date}
│⏰ \`Time\` : ${time}
╰──────────●●►

╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 \`User\`: ${userPushname}
│📟 \`Uptime\` : ${uptime}
╰──────────●●►

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ ||`;

        await nethmina.sendMessage(from, { 
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
        }, { quoted: m });

    } catch (e) {
        console.error(e);
    }
});

/*const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static')
cmd({
    pattern: "alive",
    desc: "Check bot online status",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, pushname, reply }) => {
    try {
        const pushname = m.pushName || 'User';
        await nethmina.sendMessage(from, { react: { text: "🎃", key: m.key } });

        const uptime = runtime(process.uptime());
        const date = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' });
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, timeZone: 'Asia/Colombo' });

       
      /*  await nethmina.sendPresenceUpdate('recording', from);
        
        await nethmina.sendMessage(from, { 
            audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
        }, { quoted: mek });

        

         await nethmina.sendMessage(from, { 
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" }, 
            ptv: true 
        }, { quoted: mek })
        
        
        await nethmina.sendPresenceUpdate('recording', from)
        
        const audioUrl = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3"
        const inputPath = `./temp_alive_${Date.now()}.mp3`
        const outputPath = `./temp_alive_${Date.now()}.opus`

        const response = await axios({
            method: 'get',
            url: audioUrl,
            responseType: 'stream'
        })
        
        const writer = fs.createWriteStream(inputPath)
        response.data.pipe(writer)

        writer.on('finish', () => {
            
            exec(`"${ffmpegPath}" -i ${inputPath} -c:a libopus -b:a 64k -vbr on -f ogg ${outputPath}`, async (error) => {
                if (error) {
                    console.error("FFmpeg Error:", error)
                    await nethmina.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek })
                } else {
                    const buffer = fs.readFileSync(outputPath)
                    await nethmina.sendMessage(from, {
                        audio: buffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    }, { quoted: mek })
                }

                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
            })
        })

        const { VoiceNote } = require('golden-queen-voice-note');

// Inside your Baileys message handler:
/*await VoiceNote(
  'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3', 
  from,                  
  nethmina                                      
);

        
        await nethmina.sendMessage(from, {
            video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // 4. Alive Message Caption (Monospace Fixed)
       
let mainCaption = `
👋  𝐇𝐄𝐋𝐋𝐎,  ${pushname} 𝐈❜𝐀𝐌 𝐀𝐋𝐈𝐕𝐄 𝐍𝐎𝐖 👾

╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」
│📅 \`Date\` : ${date}
│⏰ \`Time\` : ${time}
╰──────────●●►

╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 \`User\`:  ${pushname}
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
        reply(`*Error:* ${e}`);
    }
});*/ 


