const { cmd } = require('../command');

cmd({
    pattern: "add",
    desc: "Adds a member to the group",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම බලනවා)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        // 2. Group Metadata ලබා ගැනීම (Admin දත්ත ලබා ගැනීමට)
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // 3. Bot Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) {
            return reply("❌ I need to be an admin to add members.");
        }

        // 4. Owner Check (94760860835)
        const ownerNumber = "94760860835";
        if (!sender.includes(ownerNumber)) {
            return reply("❌ *Command Restricted* - Only my owner can use this.");
        }

        // 5. එකතු කළ යුතු අංකය හඳුනා ගැනීම
        let number;
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // Reply කර ඇති මැසේජ් එකේ අයිතිකරු ලබා ගැනීම
            number = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
        } else if (q) {
            // ටයිප් කර ඇති අංකය පිරිසිදු කිරීම
            number = q.replace(/[^0-9]/g, '');
        } else {
            return reply("❌ Please reply to a message, mention a user, or provide a number.");
        }

        if (!number || number.length < 7) return reply("❌ Invalid phone number format.");

        const jid = number + "@s.whatsapp.net";

        // 6. Reaction: ➕
        await conn.sendMessage(from, { react: { text: '➕', key: mek.key } });

        // 7. සාමාජිකයා එකතු කිරීමේ උත්සාහය
        const response = await conn.groupParticipantsUpdate(from, [jid], "add");

        // Privacy Settings (403 Error) Handling
        if (response[0].status === "403") {
            return reply(`⚠️ @${number} cannot be added due to Privacy settings. A 'Group Invite' might have been sent.`, { mentions: [jid] });
        } else if (response[0].status === "200") {
            return reply(`✅ 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐀ᴅᴅᴇ𝐃 @${number}`, { mentions: [jid] });
        } else {
            return reply(`❌ Failed to add member. (Status: ${response[0].status})`);
        }

    } catch (error) {
        console.error("Add Command Error:", error);
        reply("❌ Error: Unable to add member. Make sure the number is correct or the person is not already in the group.");
    }
});
