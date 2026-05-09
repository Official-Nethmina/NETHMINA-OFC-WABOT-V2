const { cmd } = require('../command');

cmd({
    pattern: "block",
    alias: ["ban"],
    category: "owner",
    desc: "Blocks a user from using the bot.",
    filename: __filename
},
async (nethmina, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Owner පරීක්ෂාව
        if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට (Owner) පමණි.");

        // 2. ඉලක්කගත පුද්ගලයා (Target JID) හඳුනා ගැනීම
        let targetJid = m.quoted ? m.quoted.sender : from;

        if (targetJid.endsWith('@g.us')) {
            return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කර හෝ Inbox එකේදී මෙම විධානය භාවිතා කරන්න.");
        }

        // 3. මුලින්ම අදාළ පුද්ගලයාට දැනුම්දීමේ මැසේජ් එකක් යැවීම
        await nethmina.sendMessage(targetJid, { 
            text: "⚠️ *You have been blocked by the Owner.*\n\nYou can no longer interact with the bot. Goodbye! 👋" 
        });

        // 4. Reaction එකක් දැමීම
        await nethmina.sendMessage(from, { react: { text: "🚫", key: mek.key } });

        // 5. තත්පර 2ක ප්‍රමදයකින් පසු Block කිරීම (Delay Logic)
        reply(`⏳ @${targetJid.split('@')[0]} ව block කිරීමට මදක් රැඳී සිටින්න...`, { mentions: [targetJid] });

        setTimeout(async () => {
            try {
                await nethmina.updateBlockStatus(targetJid, "block");
                return reply(`✅ @${targetJid.split('@')[0]} සාර්ථකව Block කරන ලදී.`, { mentions: [targetJid] });
            } catch (blockErr) {
                console.error("Delayed Block Error:", blockErr);
            }
        }, 2000); // මිලි තත්පර 2000 = තත්පර 2

    } catch (e) {
        console.error("Block Plugin Error:", e);
        reply("❌ Block කිරීමේදී දෝෂයක් සිදු විය.");
    }
});

//================Unblock=================

const { cmd } = require('../command');

cmd({
    pattern: "unblock",
    alias: ["pardon"],
    category: "owner",
    desc: "Unblocks a user from using the bot.",
    filename: __filename
},
async (nethmina, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Owner ද කියලා බලනවා
        if (!isOwner) return reply("❌ මේ විධානය පාවිච්චි කළ හැක්කේ බොට්ගේ අයිතිකරුට පමණි.");

        // 2. Unblock කළ යුතු පුද්ගලයා තෝරා ගැනීම
        let targetJid = m.quoted ? m.quoted.sender : from;

        if (targetJid.endsWith('@g.us')) {
            return reply("❌ කරුණාකර පුද්ගලයෙකුගේ මැසේජ් එකකට reply කර හෝ Inbox එකේදී මෙම විධානය භාවිතා කරන්න.");
        }

        // 3. React කිරීම
        await nethmina.sendMessage(from, { react: { text: "✅", key: mek.key } });

        // 4. Unblock කිරීමේ ක්‍රියාවලිය
        await nethmina.updateBlockStatus(targetJid, "unblock");

        // 5. සාර්ථක බව දැනුම් දීම
        return reply(`✅ @${targetJid.split('@')[0]} සාර්ථකව Unblock කරන ලදී.`, { mentions: [targetJid] });

    } catch (e) {
        console.error("Unblock Plugin Error:", e);
        reply("❌ Unblock කිරීමේදී දෝෂයක් සිදු විය.");
    }
});
