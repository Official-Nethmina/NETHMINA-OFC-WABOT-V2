const { cmd } = require('../command');

cmd({
    pattern: "updategdesc",
    alias: ["upgdesc", "gdesc", "setdesc"],
    desc: "Change the group description.",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම බලනවා)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        // 2. අලුත් විස්තරය (Description) ලබා දී තිබේදැයි බැලීම
        if (!q) return reply("❌ Please provide a new description for the group.\n\n*Example:* .updategdesc Welcome to our group!");

        // 3. Group Metadata ලබා ගැනීම (Live Data)
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // 4. Bot Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) {
            return reply("❌ I need to be an admin to change the group description.");
        }

        // 5. User (Sender) Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin) {
            return reply("❌ Only group admins can use this command.");
        }

        // 6. Reaction: 📜
        await conn.sendMessage(from, { react: { text: '📜', key: mek.key } });

        // 7. Group Description එක Update කිරීම
        await conn.groupUpdateDescription(from, q);
        
        return reply("✅ *𝐆ʀᴏᴜ𝐏 𝐃ᴇꜱᴄʀɪᴘᴛɪᴏ𝐍 𝐇ᴀ𝐒 𝐁ᴇᴇ𝐍 𝐔ᴘᴅᴀᴛᴇ𝐃.*");

    } catch (e) {
        console.error("Error updating group description:", e);
        // සමහර විට description එකේ දිග වැඩි වුණොත් හෝ වෙනත් error එකක් ආවොත්
        return reply("❌ Failed to update the group description. Please make sure the description is not too long.");
    }
});
