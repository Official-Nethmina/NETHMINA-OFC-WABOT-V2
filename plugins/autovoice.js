const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');

const processedMessages = new Set();

const voiceData = {
    "hi": "https://mp3tourl.com/audio/1777910165360-cf504b8b-95bb-4ae5-8961-78a5ccfc8d8f.mp3",
    "mk": "https://mp3tourl.com/audio/1777910196056-487d7486-78dc-43b9-88d9-55cf57c6c7cb.mp3"
};

const convertToOpus = (input, output) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffmpegPath}" -i "${input}" -c:a libopus -b:a 128k -vbr on "${output}"`, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });
};

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.key.fromMe) return;

            const msgId = mek.key.id;
            if (processedMessages.has(msgId)) return;

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                         (type === 'imageMessage') ? mek.message.imageMessage.caption : 
                         (type === 'videoMessage') ? mek.message.videoMessage.caption : '';

            if (!body) return;
            const lowerBody = body.toLowerCase().trim();

            // --- [වෙනස් කළ කොටස] ---
            // Regex පාවිච්චි කරලා වචනයක් විදිහට විතරක් තියෙනවාද බලනවා (\b = word boundary)
            const matchedKey = Object.keys(voiceData).find(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'g'); 
                return regex.test(lowerBody);
            });

            if (matchedKey) {
                processedMessages.add(msgId);
                const audioUrl = voiceData[matchedKey];
                
                await conn.sendPresenceUpdate('recording', from);
                
                const tempDir = os.tmpdir();
                const inputPath = path.join(tempDir, `voice_${Date.now()}.mp3`);
                const outputPath = path.join(tempDir, `voice_${Date.now()}.opus`);

                try {
                    const response = await axios({
                        method: 'get',
                        url: audioUrl,
                        responseType: 'arraybuffer'
                    });
                    fs.writeFileSync(inputPath, response.data);

                    await convertToOpus(inputPath, outputPath);

                    await conn.sendMessage(from, {
                        audio: fs.readFileSync(outputPath),
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    }, { quoted: mek });

                } catch (vError) {
                    console.error("❌ Error:", vError);
                    await conn.sendMessage(from, { audio: { url: audioUrl }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek });
                } finally {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    setTimeout(() => processedMessages.delete(msgId), 120000);
                }
            }
        } catch (e) {
            console.log("AutoVoice Plugin Error:", e);
        }
    }
};
