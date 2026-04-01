const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "alive",
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, {
    from,
    quoted,
    reply
}) => {
    try {
        // 1️⃣ Show recording presence
        await nethmina.sendPresenceUpdate('recording', from);

        // 2️⃣ Absolute path for reliability
        const audioPath = path.resolve('./media/voice/alive.opus');

        if (!fs.existsSync(audioPath)) {
            return reply("Voice note not found! Place alive.opus in media/voice/");
        }

        // 3️⃣ Read file as buffer
        const audioBuffer = fs.readFileSync(audioPath);

        // 4️⃣ Send as PTT
        await nethmina.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/opus',
            ptt: true
        }, { quoted: mek });

        // 5️⃣ Send image with caption
        await nethmina.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: config.ALIVE_MSG
        }, { quoted: mek });

    } catch (err) {
        console.error("ALIVE COMMAND ERROR:", err);
        reply(`Error sending alive: ${err.message}`);
    }
});
