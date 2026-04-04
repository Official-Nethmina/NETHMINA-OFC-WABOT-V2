const { cmd } = require('../command');

cmd({
    pattern: "remove",
    alias: ["kick", "k"],
    desc: "Removes a member from the group",
    category: "admin",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        // 1. Group Check (JID එකෙන් කෙලින්ම බලනවා)
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        // 2. Owner Check (94760860835)
        // මේ කමාන්ඩ් එක පාවිච්චි කරන්න පුළුවන් ඔයාට විතරයි
        const ownerNumber = "94760860835";
        if (!sender.includes(ownerNumber)) {
            return reply("❌ *Access Denied* - Only my owner can use this command.");
        }

        // 3. Group Metadata ලබා ගැනීම (Live Data)
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // 4. Bot Admin ද කියා පරීක්ෂා කිරීම (Manual Check)
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) {
            return reply("❌ I need to be an *admin* to remove members.");
        }

        // 5. ඉවත් කළ යුතු පුද්ගලයා හඳුනා ගැනීම (Reply හෝ Mention එකෙන්)
        let number;
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // මැසේජ් එකකට රිප්ලයි කර ඇත්නම්
            number = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
        } else if (q) {
            // නම්බර් එකක් හෝ මෙන්ෂන් එකක් ඇත්නම්
            number = q.replace(/[^0-9]/g, '');
        } else {
            return reply("❌ Please reply to a message or provide a number to remove.");
        }

        if (!number || number.length < 7) return reply("❌ Invalid phone number format.");

        const jid = number + "@s.whatsapp.net";

        // බොට්වම අයින් කරන්න හැදුවොත්
        if (jid === botNumber) return reply("❌ I cannot remove myself from the group.");

        // 6. Reaction: ❌
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });

        // 7. සාමාජිකයා ඉවත් කිරීම (Remove/Kick)
        await conn.groupParticipantsUpdate(from, [jid], "remove");
        
        return reply(`✅ 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐑ᴇᴍᴏᴠᴇ𝐃 @${number}`, { mentions: [jid] });

    } catch (error) {
        console.error("Remove command error:", error);
        reply("❌ Failed to remove the member. They might have already left or I don't have permission.");
    }
});
