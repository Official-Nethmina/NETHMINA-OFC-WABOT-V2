const { cmd } = require('../command');

cmd({
    pattern: "listjid",
    alias: ["getjids", "jids"],
    react: "📋",
    desc: "Get JID list of all groups the bot is in.",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { from, isOwner, reply }) => {
    try {
        // 🔒 බොට් ඕනර්ද කියා පරික්ෂා කිරීම
        if (!isOwner) return await reply("❌ Only the bot owner can use this command.");

        // බොට් ඉන්න සියලුම ගෲප් දත්ත ලබාගැනීම
        let getGroups = await nethmina.groupFetchAllParticipating();
        let groups = Object.values(getGroups);

        if (!groups || groups.length === 0) {
            return await reply("❌ The bot is not in any WhatsApp groups.");
        }

        let txt = `📋 *𝐍𝐄𝐓𝐇𝐌𝐈𝐍𝐀-𝐎𝐅𝐂-𝐖𝐀-𝐁𝐎𝐓 𝐆𝐑𝐎𝐔𝐏 𝐉𝐈𝐃 𝐋𝐈𝐒𝐓*\n\n`;
        txt += `📊 *Total Groups:* ${groups.length}\n`;
        txt += `───────────────────\n\n`;

        // හැම ගෲප් එකකම නම සහ JID එක ලැයිස්තුවට එකතු කිරීම
        groups.forEach((group, index) => {
            txt += `*${index + 1}. Group Name:* ${group.subject}\n`;
            txt += `👥 *Members:* ${group.participants ? group.participants.length : 'Unknown'}\n`;
            txt += `🆔 *JID (Tap box to copy):*\n`;
            // 🔥 [EASY COPY] තනි කොටුවක් ඇතුළත JID එක පමණක් දැමීම (Tap කර සැනින් කොපි වේ)
            txt += `\`\`\`${group.id}\`\`\`\n`;
            txt += `───────────────────\n\n`;
        });

        txt += `💡 *Tip:* Just tap on the JID box to copy it instantly and use with \`.hidetag [JID] [Message]\` from inbox!`;

        // 📤 ඕනර්ට ලැයිස්තුව සෙන්ඩ් කිරීම
        return await reply(txt);

    } catch (e) {
        console.error("ListJID Error:", e);
        
        // Fallback option
        try {
            if (nethmina.store && nethmina.store.chats) {
                let allChats = nethmina.store.chats.all();
                let groupChats = allChats.filter(chat => chat.id.endsWith('@g.us'));
                
                if (groupChats.length === 0) return await reply("❌ Failed to fetch groups.");

                let txt2 = `📋 *𝐆𝐑𝐎𝐔𝐏 𝐉𝐈𝐃 𝐋𝐈𝐒𝐓 (From Store)*\n\n`;
                groupChats.forEach((chat, index) => {
                    txt2 += `*${index + 1}.* ${chat.name || 'Group'}\n🆔\n\`\`\`${chat.id}\`\`\`\n\n`;
                });
                return await reply(txt2);
            }
        } catch (err) {
            console.error("Fallback Error:", err);
        }

        reply(`❌ *Error Occurred !!*\n\n${e.message || e}`);
    }
});
