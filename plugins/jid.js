const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["id", "chatid", "gjid"],  
    desc: "Get cleaned JID of current chat/user",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, reply, sender 
}) => {
    try {
        // 1. Reaction (🆔)
        await conn.sendMessage(from, { react: { text: "🆔", key: mek.key } });

        // 2. Owner Check
        const ownerNumber = "94760860835";
        if (!sender.includes(ownerNumber)) {
            return reply("❌ *Command Restricted* - Only my creator can use this.");
        }

        // 3. JID පිරිසිදු කිරීම (අර :10 වගේ කෑලි අයින් කිරීම)
        const cleanSender = sender.split(":")[0] + "@s.whatsapp.net";
        const currentChatJid = from.split(":")[0]; // සමහර විට Group ID වලත් මෙහෙම වෙන්න පුළුවන්

        if (from.endsWith('@g.us')) {
            // Group එකක් නම්
            return reply(`👥 *𝐆𝐑𝐎𝐔𝐏 𝐉𝐈𝐃:*\n\n\`\`\`${currentChatJid}\`\`\``);
        } else {
            // Personal Chat එකක් නම්
            return reply(`👤 *𝐔𝐒𝐄𝐑 𝐉𝐈𝐃:*\n\n\`\`\`${cleanSender}\`\`\``);
        }

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});
