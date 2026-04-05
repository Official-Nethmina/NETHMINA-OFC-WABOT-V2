const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({ log: true });

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
        const mp3Path = path.join(__dirname, "..", "Voice-notes", "alive.mp3");

        if (!ffmpeg.isLoaded()) await ffmpeg.load();

        ffmpeg.FS('writeFile', 'alive.mp3', await fetchFile(mp3Path));

        await ffmpeg.run('-i', 'alive.mp3', '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', 'alive.ogg');
        
        const oggData = ffmpeg.FS('readFile', 'alive.ogg');

        await nethmina.sendMessage(from, { 
         audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" },
            mimetype: 'audio/mpeg',
              ptt: true
              },      { quoted: mek });

        await nethmina.sendMessage(
            from,
            {
                video: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Video-notes/PTV-20250623-WA0021.mp4" },
                mimetype: 'video/mp4',
                ptv: true
            },
            { quoted: mek }
        );

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
