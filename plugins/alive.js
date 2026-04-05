const { cmd } = require('../command');
const config = require('../config');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
ffmpeg.setFfmpegPath('ffmpeg'); 
async function downloadAndConvertToVoiceNote(url, outputPath) {
    return new Promise(async (resolve, reject) => {
        const tempInput = path.join(__dirname, '../temp', `temp_${Date.now()}.mp3`);
        
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        try {
            const response = await axios({ url, responseType: 'stream' });
            const writer = fs.createWriteStream(tempInput);
            await pipeline(response.data, writer);
            ffmpeg(tempInput)
                .audioCodec('libopus')
                .audioBitrate('16k')
                .audioFrequency(16000)
                .audioChannels(1)
                .format('ogg')
                .on('end', () => {
                    fs.unlinkSync(tempInput);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                    reject(err);
                })
                .save(outputPath);
        } catch (err) {
            reject(err);
        }
    });
}
cmd({
    pattern: "alive",
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, { from, quoted, reply }) => {
    try {
        
        if (mek.key && mek.key.remoteJid) {
            await nethmina.sendMessage(from, { react: { text: "🎃", key: mek.key } });
        }

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        try {
            const audioUrl = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3";
            const outputOgg = path.join(tempDir, `voice_${Date.now()}.ogg`);
            
            await downloadAndConvertToVoiceNote(audioUrl, outputOgg);
            
            await nethmina.sendMessage(from, { 
                audio: fs.readFileSync(outputOgg), 
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true 
            }, { quoted: mek });
            
            fs.unlinkSync(outputOgg);
        } catch (err) {
            console.error("Voice note error:", err);
        }

        try {
            await nethmina.sendMessage(
                from,
                {
                    video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
                    mimetype: 'video/mp4',
                    ptv: true
                },
                { quoted: mek }
            );
        } catch (err) {
            console.error("Video note error:", err);
        }
        
        await nethmina.sendMessage(
            from,
            { 
                image: { url: config.ALIVE_IMG }, 
                caption: config.ALIVE_MSG 
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error("Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
