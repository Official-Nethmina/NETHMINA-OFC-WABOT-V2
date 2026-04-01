const { cmd } = require('../command')
const config = require('../config')
const axios = require('axios')
const fs = require("fs");


cmd({
    pattern: "alive",
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
    
},
async (nethmina, mek, m, { from, quoted, reply }) => {
    try {
        // Send reaction first
        if (mek.key && mek.key.remoteJid) {
            await nethmina.sendMessage(from, { react: { text: "🎃", key: mek.key } });
        }

       /* await nethmina.sendMessage(from, { 
    audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" }, 
    mimetype: 'audio/ogg; codecs=opus', // Me mimetype eka danna
    ptt: true 
}, { quoted: mek });
        */
// Methanin mn dannm ube voice raw url ekama 
        
 const audioUrl = 'https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3';
    const inputPath = `./temp_alive_${Date.now()}.mp3`;
    const outputPath = `./temp_alive_${Date.now()}.opus`;

    try {
        const response = await axios({ method: 'get', url: audioUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(inputPath);
        response.data.pipe(writer);

        await new Promise((res, rej) => {
            writer.on('finish', res);
            writer.on('error', rej);
        });

        await new Promise((res, rej) => {
            exec(`ffmpeg -i ${inputPath} -c:a libopus -b:a 64k -vbr on -f ogg ${outputPath}`, (err) => {
                if (err) rej(err);
                else res();
            });
        });

        const buffer = fs.readFileSync(outputPath);
        await nethmina.sendMessage(from, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    } catch (err) {
        console.error(err);
        await nethmina.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: true
        }, { quoted: mek });
    }
        // Send video note
        await nethmina.sendMessage(
            from,
            {
                video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
                mimetype: 'video/mp4',
                ptv: true
            },
            { quoted: mek }
        );
        
        // Send alive image with caption
        return await nethmina.sendMessage(
            from,
            { image: { url: config.ALIVE_IMG }, caption: config.ALIVE_MSG },
            { quoted: mek }
        );

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
