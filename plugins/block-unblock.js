const { cmd } = require('../command');

// --- BLOCK COMMAND ---
cmd({
    pattern: "block",
    alias: ["ban"],
    category: "owner",
    desc: "Blocks a user from using the bot.",
    filename: __filename
},
async (nethmina, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

        // JID එක ලබාගෙන පිරිසිදු කිරීම
        let rawJid = m.quoted ? m.quoted.sender : from;
        let targetJid = rawJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';

        if (from.endsWith('@g.us') && !m.quoted) {
            return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කරන්න.");
        }

        // 1. දැනුම්දීමේ මැසේජ් එක යැවීම
        await nethmina.sendMessage(targetJid, { 
            text: "⚠️ *You have been blocked by the Owner.*\n\nYou can no longer interact with the bot." 
        });

        // 2. Reaction එකක් දැමීම
        await nethmina.sendMessage(from, { react: { text: "🚫", key: mek.key } });

        reply(`⏳ @${targetJid.split('@')[0]} ව block කරමින් පවතියි...`, { mentions: [targetJid] });

        // 3. තත්පර 2ක Delay එකකින් පසු ඇත්තටම block කිරීම
        setTimeout(async () => {
            try {
                await nethmina.updateBlockStatus(targetJid, "block");
                return reply(`✅ @${targetJid.split('@')[0]} සාර්ථකව Block කරන ලදී.`, { mentions: [targetJid] });
            } catch (err) {
                console.error("Block Error:", err);
                reply("❌ Block කිරීමේදී තාක්ෂණික දෝෂයක් ආවා.");
            }
        }, 2000);

    } catch (e) {
        console.error("Block Plugin Error:", e);
        reply("❌ දෝෂයක් සිදු විය.");
    }
});

// --- UNBLOCK COMMAND ---
cmd({
    pattern: "unblock",
    alias: ["pardon"],
    category: "owner",
    desc: "Unblocks a user from using the bot.",
    filename: __filename
},
async (nethmina, mek, m, { from, isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

        let rawJid = m.quoted ? m.quoted.sender : from;
        let targetJid = rawJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';

        if (from.endsWith('@g.us') && !m.quoted) {
            return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කරන්න.");
        }

        await nethmina.sendMessage(from, { react: { text: "✅", key: mek.key } });

        await nethmina.updateBlockStatus(targetJid, "unblock");
        return reply(`✅ @${targetJid.split('@')[0]} සාර්ථකව Unblock කරන ලදී.`, { mentions: [targetJid] });

    } catch (e) {
        console.error("Unblock Plugin Error:", e);
        reply("❌ Unblock කිරීමේදී දෝෂයක් සිදු විය.");
    }
});
