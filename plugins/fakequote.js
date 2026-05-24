const { cmd } = require('../command');

cmd({
    pattern: "fake",
    alias: ["spoof", "fquote"],
    react: "🎭",
    desc: "Create a fake quoted reply message of any user.",
    category: "fun",
    use: '.fake @user | target text | bot reply text',
    filename: __filename
},
async (nethmina, mek, msg, { from, q, isGroup, reply }) => {
    try {
        if (!isGroup) return await reply("❌ This command can only be used in groups.");
        
        if (!q) return await reply("❌ *Format:* `.fake @user | [ඔහු කීවා වැනි බොරු කතාව] | [බොටා දෙන රිප්ලයි එක]`\n\n*Example:* `.fake @9477xxxxxxx | මම අද හැමෝටම රීලෝඩ් දානවා | අඩේ සිරාවටමද ලොක්කා? 🤩`");

        // '|' ලකුණෙන් කොටස් වලට වෙන් කර ගැනීම
        const parts = q.split("|");
        if (parts.length < 3) {
            return await reply("❌ Incorrect format! Please provide all 3 parts separated by `|`.\nFormat: `.fake @user | fake text | bot reply`");
        }

        const mentionPart = parts[0].trim();
        const fakeText = parts[1].trim();
        const botReplyText = parts[2].trim();

        // මැන්ෂන් කරපු කෙනාගේ JID එක ලබා ගැනීම (මැසේජ් එකේ මෙන්ෂන් ලිස්ට් එකෙන්)
        const mentionedJids = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentionedJids.length === 0) {
            return await reply("❌ Please tag/mention (@user) the person you want to spoof.");
        }

        const targetUserJid = mentionedJids[0]; // පළමු මැන්ෂන් එක ගැනීම
        const targetUserName = mentionPart.replace(/@\d+/, '').trim() || "User";

        // 🔥 ව්‍යාජ Quoted Message ව්‍යුහය (Fake Structure) සකසා ගැනීම
        const fakeQuotedMessage = {
            key: {
                remoteJid: from,
                fromMe: false, // බොටා නෙවෙයි වෙන කෙනෙක් කිව්වා වගේ පෙන්වීමට
                id: "FAKE" + Math.random().toString(36).substring(2, 10).toUpperCase(), // Random Message ID එකක්
                participant: targetUserJid // අහුවෙන කෙනාගේ WhatsApp JID එක
            },
            message: {
                conversation: fakeText // ඔහු කීවා වැනි ව්‍යාජ වදන
            }
        };

        // 📤 බොටා ලව්වා ව්‍යාජ රිප්ලයි එක ගෲප් එකට සෙන්ඩ් කිරීම
        await nethmina.sendMessage(from, { 
            text: botReplyText 
        }, { 
            quoted: fakeQuotedMessage // මෙතනට අපේ Fake මැසේජ් එක පාස් කරනවා
        });

    } catch (e) {
        console.error("Fake Quote Error:", e);
        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
