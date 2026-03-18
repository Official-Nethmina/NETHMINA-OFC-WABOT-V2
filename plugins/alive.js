const { cmd, commands } = require('../command');
const config = require('../config');

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
        const oggUrl = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/cmd-voice/alive%20(online-audio-converter.com).ogg";

        // ----------------- 1️⃣ Send WhatsApp Voice Note -----------------
        await nethmina.sendMessage(from, {
            audio: { url: oggUrl },
            mimetype: "audio/ogg",
            ptt: true
        }, { quoted: mek });

        // ----------------- 2️⃣ Send Image + Caption -----------------
        await nethmina.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: config.ALIVE_MSG
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
