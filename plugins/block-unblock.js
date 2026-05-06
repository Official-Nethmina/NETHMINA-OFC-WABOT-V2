// plugins/block.js

module.exports = {
    pattern: "block",
    alias: ["ban"],
    category: "owner",
    desc: "Blocks a user from using the bot.",
    function: async (nethmina, mek, m, { from, isOwner, reply, sender }) => {
        try {
            // 1. බලය තහවුරු කිරීම (Owner ද කියලා බලනවා)
            if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට (Owner) පමණි.");

            // 2. Block කළ යුතු JID එක තෝරා ගැනීම (Reply එකක් නම් ඒ පුද්ගලයා, නැත්නම් ඒ Chat එක)
            let targetJid = m.quoted ? m.quoted.sender : from;

            // Group එකක් ඇතුළේදී Group එකම block කරන්න බැරි නිසා ඒක චෙක් කරනවා
            if (targetJid.endsWith('@g.us')) {
                return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කර හෝ Inbox එකේදී මෙම විධානය භාවිතා කරන්න.");
            }

            // 3. අදාළ පුද්ගලයාට මැසේජ් එකක් යැවීම
            await nethmina.sendMessage(targetJid, { text: "⚠️ You have been blocked by the Owner. You can no longer interact with the bot." });

            // 4. මැසේජ් එකට React කිරීම
            await nethmina.sendMessage(from, { react: { text: "🚫", key: mek.key } });

            // 5. Block කිරීමේ ක්‍රියාවලිය
            await nethmina.updateBlockStatus(targetJid, "block");

            // 6. සාර්ථක බව දැනුම් දීම
            return reply(`✅ @${targetJid.split('@')[0]} සාර්ථකව Block කරන ලදී.`, { mentions: [targetJid] });

        } catch (e) {
            console.error("Block Plugin Error:", e);
            reply("❌ Block කිරීමේදී දෝෂයක් සිදු විය.");
        }
    }
};

// plugins/unblock.js

module.exports = {
    pattern: "unblock",
    alias: ["pardon"],
    category: "owner",
    desc: "Unblocks a user from using the bot.",
    function: async (nethmina, mek, m, { from, isOwner, reply, sender }) => {
        try {
            // 1. Owner ද කියලා පරීක්ෂා කිරීම
            if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

            // 2. Unblock කළ යුතු JID එක තෝරා ගැනීම
            let targetJid = m.quoted ? m.quoted.sender : from;

            if (targetJid.endsWith('@g.us')) {
                return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කර හෝ Inbox එකේදී මෙම විධානය භාවිතා කරන්න.");
            }

            // 3. මැසේජ් එකට React කිරීම
            await nethmina.sendMessage(from, { react: { text: "✅", key: mek.key } });

            // 4. Unblock කිරීමේ ක්‍රියාවලිය
            await nethmina.updateBlockStatus(targetJid, "unblock");

            // 5. සාර්ථක බව දැනුම් දීම
            return reply(`✅ @${targetJid.split('@')[0]} Successfully unblocked. Now he can use the bot.`, { mentions: [targetJid] });

        } catch (e) {
            console.error("Unblock Plugin Error:", e);
            reply("❌ Unblock කිරීමේදී දෝෂයක් සිදු විය.");
        }
    }
};
