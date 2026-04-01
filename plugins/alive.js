const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');

cmd({
    pattern: "alive",
    alias: ["bot", "robo", "robot"],
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
        // 1️⃣ Show typing/recording presence
        await nethmina.sendPresenceUpdate('recording', from);

        // 2️⃣ Read local .opus file
        const audioPath = './media/voice/alive.opus';
        if (!fs.existsSync(audioPath)) {
            return reply("Voice note file not found! Make sure alive.opus is in media/voice/");
        }
        const audioBuffer = fs.readFileSync(audioPath);

        // 3️⃣ Send voice note as PTT
        await nethmina.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/opus',
            ptt: true
        }, { quoted: mek });

        // 4️⃣ Send image with caption
        await nethmina.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: config.ALIVE_MSG
        }, { quoted: mek });

    } catch (e) {
        console.error("ALIVE COMMAND ERROR:", e);
        reply(`Error sending alive: ${e.message}`);
    }
});
