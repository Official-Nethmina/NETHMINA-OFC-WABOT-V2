const { cmd } = require('../command');

cmd({
    pattern: "readmore",
    alias: ["rmore", "spoiler"],
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
        const hiddenText = parts.slice(1).join("|").trim();

        // 🔥 [MANUAL REACT] ඔටෝ රියැක්ට් නොවෙන ප්‍රශ්නය මඟහරවා ගැනීමට කෝඩ් එක ඇතුළෙන්ම රියැක්ෂන් එක දමයි
        await nethmina.sendMessage(from, { 
            react: { text: "📖", key: mek.key } 
        });

        // Readmore එක හදන Invisible Character එක (Left-to-Right Mark)
        const readmoreChar = String.fromCharCode(8206); // \u200e
        
        // එක දිගට 4000 වතාවක් Invisible Character එක රීපීට් කිරීම
        const spaceBypass = readmoreChar.repeat(4000);

        // අවසාන මැසේජ් එක එකලස් කිරීම
        const finalMessage = `${introText}${spaceBypass} ${hiddenText}`;

        // 📤 මැසේජ් එක සෙන්ඩ් කිරීම (මෙහි return එක ඉවත් කර ස්ථාවර කර ඇත)
        await nethmina.sendMessage(from, { text: finalMessage }, { quoted: mek });

    } catch (e) {
        console.error("Readmore Command Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
