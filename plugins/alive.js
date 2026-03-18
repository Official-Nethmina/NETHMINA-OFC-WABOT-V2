const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

cmd({
    pattern: "alive",
    alias: ["bot","robo","robot"],
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, {
    from, quoted, body, isCmd, command, args,
    sender, senderNumber, reply
}) => {
    try {
        // ----------------- 1️⃣ Convert MP3 to OGG -----------------
        const mp3Url = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/cmd-voice/alive.mp3";
        const tempOgg = path.join(__dirname, 'alive.ogg');

        await new Promise((resolve, reject) => {
            ffmpeg(mp3Url)
                .audioCodec('libopus')
                .format('ogg')
                .on('error', reject)
                .on('end', resolve)
                .save(tempOgg);
        });

        // ----------------- 2️⃣ Send as WhatsApp voice note -----------------
        await nethmina.sendMessage(from, {
            audio: fs.readFileSync(tempOgg),
            mimetype: 'audio/ogg',
            ptt: true
        }, { quoted: mek });

        // ----------------- 3️⃣ Send image + caption -----------------
        await nethmina.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: config.ALIVE_MSG
        }, { quoted: mek });

        // Optional: delete temp file
        fs.unlinkSync(tempOgg);

    } catch (e) {
        console.log(e);
        reply(`Error: ${e}`);
    }
});
