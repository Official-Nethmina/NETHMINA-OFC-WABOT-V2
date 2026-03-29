const { cmd, commands } = require('../command');
const config = require('../config');
const axios = require("axios");

cmd({
    pattern: "alive",
    alias: ["bot", "robo", "robot"],
    react: "🎃",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async (nethmina, mek, m, {
    from, quoted, reply
}) => {
    try {

        await nethmina.sendPresenceUpdate('recording', from);

        // 🔥 Download video from URL → buffer (VERY IMPORTANT)
        const videoURL = "https://github.com/Nethmina-dev/BOT-DATA/raw/refs/heads/main/V-notes/Video%20note%201.mp4";
        const getVid = await axios.get(videoURL, { responseType: "arraybuffer" });
        const videoBuffer = Buffer.from(getVid.data);

        // 1️⃣ Send TRUE Video Note (Round Video)
        await nethmina.sendMessage(
            from,
            {
                video: videoBuffer,
                mimetype: "video/mp4",
                fileName: "alive.mp4",
                contextInfo: { 
                    isVideoNote: true   // THIS makes the video round
                }
            },
            { quoted: mek }
        );

        // 2️⃣ Send Alive Message
        return await nethmina.sendMessage(
            from,
            {
                image: { url: config.ALIVE_IMG },
                caption: config.ALIVE_MSG
            },
            { quoted: mek }
        );

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
