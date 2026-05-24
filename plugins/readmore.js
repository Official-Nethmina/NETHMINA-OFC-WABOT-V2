const { cmd } = require('../command');

cmd({
    pattern: "readmore",
    alias: ["rmore", "spoiler"],
    react: "📖",
    desc: "Create a WhatsApp Read More message.",
    category: "tools",
    filename: __filename
},
async (nethmina, mek, msg, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ *Format:* `.readmore [Intro Text] | [Hidden Text]`\n\n*Example:* `.readmore Click here to see magic | I love Nethmina Bot! 😜`");

        // '|' ලකුණෙන් මැසේජ් එක කොටස් දෙකකට වෙන් කර ගැනීම
        const parts = q.split("|");
        
        if (parts.length < 2) {
            return await reply("❌ Please use the `|` symbol to separate the intro text and hidden text.\n*Example:* `.readmore Hello | World`");
        }

        const introText = parts[0].trim();
        const hiddenText = parts.slice(1).join("|").trim(); // යම් හෙයකින් තව '|' තිබ්බොත් ඒවා එකතු කර ගැනීම

        // 🔥 Readmore එක හදන Invisible Character එක (Left-to-Right Mark)
        const readmoreChar = String.fromCharCode(8206); // \u200e
        
        // එක දිගට 4000 වතාවක් Invisible Character එක රීපීට් කිරීමෙන් Read More බටන් එක සාදා ගැනීම
        const spaceBypass = readmoreChar.repeat(4000);

        // අවසාන මැසේජ් එක එකලස් කිරීම
        const finalMessage = `${introText}${spaceBypass} ${hiddenText}`;

        // 📤 මැසේජ් එක සෙන්ඩ් කිරීම
        return await nethmina.sendMessage(from, { text: finalMessage }, { quoted: mek });

    } catch (e) {
        console.error("Readmore Command Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
