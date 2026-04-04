const { cmd } = require('../command');

cmd({
    pattern: "unlockgc",
    alias: ["unlock", "unlockgroup"],
    desc: "Unlock group settings (Everyone can edit group info).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        const ownerNumber = "94760860835";
        const isOwner = sender.includes(ownerNumber);
        let targetJid = from;

        // 1. Reaction එක ලබා දීම (🔓)
        await conn.sendMessage(from, { react: { text: '🔓', key: mek.key } });

        // 2. Inbox සිට Remote Unlock කිරීම (Owner Only)
        if (!from.endsWith('@g.us') && isOwner && q && q.endsWith('@g.us')) {
            targetJid = q.trim();
        }

        // 3. Group Validity Check
        if (!targetJid.endsWith('@g.us')) return reply("❌ This command must target a group.");

        // 4. Group Metadata ලබා ගැනීම
        const groupMetadata = await conn.groupMetadata(targetJid).catch(() => null);
        if (!groupMetadata) return reply("❌ Failed to fetch group info.");
        const participants = groupMetadata.participants;

        // 5. Bot Admin Check (Manual)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) return reply("❌ I need to be an *admin* to unlock the group settings.");

        // 6. User Admin Check (ගෲප් එක ඇතුළේදී පමණක්)
        if (from.endsWith('@g.us')) {
            const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
            const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');
            if (!isUserActuallyAdmin && !isOwner) return reply("❌ Only group admins can use this command.");
        }

        // 7. Group Settings Unlock කිරීම
        // 'unlocked' - සාමාන්‍ය අයටත් settings වෙනස් කළ හැක
        await conn.groupSettingUpdate(targetJid, 'unlocked');
        
        // 8. පිළිතුර යැවීම
        const successMsg = `✅ *𝐆ʀᴏᴜ𝐏 𝐒ᴇᴛᴛɪɴɢ𝐒 𝐔ɴʟᴏᴄᴋᴇ𝐃* in *${groupMetadata.subject}*.\nNow everyone can edit group info.`;
        
        if (from !== targetJid) {
            await conn.sendMessage(targetJid, { text: "🔓 *𝐆ʀᴏᴜ𝐏 𝐒ᴇᴛᴛɪɴɢ𝐒 𝐔ɴʟᴏᴄᴋᴇ𝐃 𝐁ʏ 𝐎ᴡɴᴇ𝐑*" });
            return reply(successMsg);
        } else {
            return reply(successMsg);
        }

    } catch (e) {
        console.error("Error unlocking group settings:", e);
        return reply("❌ Failed to unlock the group settings.");
    }
});
