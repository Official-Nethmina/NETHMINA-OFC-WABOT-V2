const { cmd } = require('../command');

cmd({
    pattern: "demote",
    alias: ["d", "dismiss", "removeadmin"],
    desc: "Demotes a group admin to a normal member",
    category: "admin",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
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
            return reply("❌ I need to be an admin to demote members.");
        }

        // 4. User (Sender) Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin) {
            return reply("❌ Only group admins can use this command.");
        }

        // 5. Demote කළ යුතු අංකය හඳුනා ගැනීම
        let number;
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            number = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
        } else if (q) {
            number = q.replace(/[^0-9]/g, '');
        } else {
            return reply("❌ Please reply to a message or provide a number to demote.");
        }

        if (!number || number.length < 7) return reply("❌ Invalid phone number format.");

        const jid = number + "@s.whatsapp.net";

        // බොට්වම demote කරන්න හැදුවොත්
        if (jid === botNumber) return reply("❌ I cannot demote myself.");

        // 6. Reaction: ⬇️
        await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

        // 7. Demote කිරීම (Admin පදවිය ඉවත් කිරීම)
        await conn.groupParticipantsUpdate(from, [jid], "demote");
        
        return reply(`✅ 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐃ᴇᴍᴏᴛᴇᴅ @${number} 𝐓𝐎 𝐌ᴇᴍʙᴇʀ.`, { mentions: [jid] });

    } catch (error) {
        console.error("Demote command error:", error);
        reply("❌ Failed to demote the member. Make sure the user is an admin in this group.");
    }
});
