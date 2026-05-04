const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');

// ==========================================
// CONFIGURATION: වචන සහ URL මෙතනට ඇඩ් කරන්න
// ==========================================
const voiceData = {
    "hi": "https://mp3tourl.com/audio/1777910165360-cf504b8b-95bb-4ae5-8961-78a5ccfc8d8f.mp3",
    "mk": "https://mp3tourl.com/audio/1777910196056-487d7486-78dc-43b9-88d9-55cf57c6c7cb.mp3"
};

// Voice Note එක Opus වලට හරවන function එක
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

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : 
                         (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                         (type === 'imageMessage') ? mek.message.imageMessage.caption : 
                         (type === 'videoMessage') ? mek.message.videoMessage.caption : '';

            if (!body) return;
            const lowerBody = body.toLowerCase().trim();

            // වචනය ගැලපෙනවාදැයි පරීක්ෂා කිරීම
            if (voiceData[lowerBody]) {
                const audioUrl = voiceData[lowerBody];
                
                // Recording status පෙන්වීම
                await conn.sendPresenceUpdate('recording', from);
                
                const tempDir = os.tmpdir();
                const inputPath = path.join(tempDir, `voice_${Date.now()}.mp3`);
                const outputPath = path.join(tempDir, `voice_${Date.now()}.opus`);

                try {
                    // 1. Audio එක Download කිරීම
                    const response = await axios({
                        method: 'get',
                        url: audioUrl,
                        responseType: 'arraybuffer'
                    });
                    fs.writeFileSync(inputPath, response.data);

                    // 2. Opus වලට Convert කිරීම (Real Voice Note එකක් කරන්න)
                    await convertToOpus(inputPath, outputPath);

                    // 3. යැවීම
                    await conn.sendMessage(from, {
                        audio: fs.readFileSync(outputPath),
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    }, { quoted: mek });

                    console.log(`✅ AutoVoice Sent: ${lowerBody}`);

                } catch (vError) {
                    console.error("❌ Conversion Error, sending normal MP3:", vError);
                    // මොකක් හරි හේතුවකින් Convert වුණේ නැත්නම් සාමාන්‍ය එක යවනවා
                    await conn.sendMessage(from, { 
                        audio: { url: audioUrl }, 
                        mimetype: "audio/mpeg", 
                        ptt: true 
                    }, { quoted: mek });
                } finally {
                    // Temp files මකා දැමීම
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                }
            }
        } catch (e) {
            console.log("AutoVoice Plugin Error:", e);
        }
    }
};
