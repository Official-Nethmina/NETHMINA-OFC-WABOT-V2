const { cmd } = require('../command');

cmd({
    pattern: "invite",
    alias: ["glink", "grouplink", "link"],
    desc: "Get group invite link.",
    category: "group",
    filename: __filename,
}, 
async (conn, mek, m, { from, reply, sender }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම පරීක්ෂා කිරීම)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        // 2. Group Metadata ලබා ගැනීම (Live Data)
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // 3. Bot Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) {
            return reply("❌ I need to be an *admin* to get the group link.");
        }

        // 4. User (Sender) Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin) {
            return reply("❌ Only group admins can use this command.");
        }

        // 5. Reaction: 🔗
        await conn.sendMessage(from, { react: { text: '🔗', key: mek.key } });

        // 6. Invite Code එක ලබා ගැනීම සහ Link එක සෑදීම
        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) return reply("❌ Failed to retrieve the invite code.");

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        // 7. පිළිතුර යැවීම
        return reply(`*𝐇ᴇʀ𝐄 𝐈𝐒 𝐘ᴏᴜ𝐑 𝐆ʀᴏᴜ𝐏 𝐈ɴᴠɪᴛ𝐄 𝐋ɪɴ𝐊:*\n\n${inviteLink}`);
        
    } catch (error) {
        console.error("Error in invite command:", error);
        reply(`❌ An error occurred: ${error.message || "Unknown error"}`);
    }
});
