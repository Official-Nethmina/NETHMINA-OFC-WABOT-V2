const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["id", "chatid", "gjid"],  
    desc: "Get full JID of current chat/user",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, isGroup, reply, sender 
}) => {
    try {
        // 🚨 ඔයාගේ නම්බර් එක මෙතන පරීක්ෂා කරනවා (config එකේ ප්‍රශ්නයක් තිබ්බත් මේක වැඩ කරනවා)
        const ownerNumber = "94760860835";
        const isOwner = sender.includes(ownerNumber);

        if (!isOwner) {
            return reply("❌ *Command Restricted* - Only bot owner can use this.");
        }

        if (isGroup) {
            // Group JID එක පෙන්වීම
            const groupJID = from;
            return reply(`👥 *𝐆ʀᴏᴜ𝐏 𝐉𝐈𝐃:*\n\`\`\`${groupJID}\`\`\``);
        } else {
            // User JID එක පෙන්වීම
            const userJID = sender;
            return reply(`👤 *𝐔ꜱᴇ𝐑 𝐉𝐈𝐃:*\n\`\`\`${userJID}\`\`\``);
        }

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});
