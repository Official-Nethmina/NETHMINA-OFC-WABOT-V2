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
        // ----------------- Send Image + Caption Only -----------------
        await nethmina.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: config.ALIVE_MSG
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
