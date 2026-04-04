const { cmd } = require('../command');

cmd({
    pattern: "updategname",
    alias: ["upgname", "gname", "setname"],
    desc: "Change the group name.",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම බලනවා)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        // 2. අලුත් නම (Group Name) ලබා දී තිබේදැයි බැලීම
        if (!q) return reply("❌ Please provide a new name for the group.\n\n*Example:* .updategname My Awesome Group");

        // 3. Group Metadata ලබා ගැනීම (Live Data)
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // 4. Bot Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) {
            return reply("❌ I need to be an admin to update the group name.");
        }

        // 5. User (Sender) Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin) {
            return reply("❌ Only group admins can use this command.");
        }

        // 6. Reaction: 📝
        await conn.sendMessage(from, { react: { text: '📝', key: mek.key } });

        // 7. Group Name එක Update කිරීම (groupUpdateSubject)
        await conn.groupUpdateSubject(from, q);
        
        return reply(`✅ *𝐆ʀᴏᴜ𝐏 𝐍ᴀᴍ𝐄 𝐇ᴀ𝐒 𝐁ᴇᴇ𝐍 𝐔ᴘᴅᴀᴛᴇ𝐃 𝐓𝐎:* \n"${q}"`);

    } catch (e) {
        console.error("Error updating group name:", e);
        // සමහර විට නමේ දිග වැඩි වුණොත් (උපරිම 25-30 characters) error එකක් එන්න පුළුවන්
        return reply("❌ Failed to update the group name. Please make sure the name is not too long.");
    }
});
