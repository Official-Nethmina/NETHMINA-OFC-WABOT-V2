const { cmd } = require('../command')
const config = require('../config');

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

        await nethmina.sendPresenceUpdate('recording', from);
await nethmina.sendMessage(from, { audio: { url: "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/Voice-notes/alive.mp3" }, mimetype: 'audio/mpeg' }, { quoted: mek });
        
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
