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

       // 3. JID පිරිසිදු කිරීම
        const cleanSender = sender.split("@")[0] + "@s.whatsapp.net";
        const cleanChat = from.split("@")[0] + (from.endsWith('@g.us') ? "@g.us" : "@s.whatsapp.net");

        if (from.endsWith('@g.us')) {
            // --- Group JID ---
            const sentMsg = await conn.sendMessage(from, { text: "👥 *𝐆𝐑𝐎𝐔𝐏 𝐉𝐈𝐃*" }, { quoted: mek });
            await conn.sendMessage(from, { text: cleanChat }, { quoted: sentMsg });
            
        } else {
            // --- User JID ---
            const sentMsg = await conn.sendMessage(from, { text: "👤 *𝐔𝐒𝐄𝐑 𝐉𝐈𝐃*" }, { quoted: mek });
            await conn.sendMessage(from, { text: cleanSender }, { quoted: sentMsg });
        }

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});
