const { cmd } = require('../command');

cmd({
    pattern: "add",
    alias: ["a", "invite"],
    desc: "Adds a member to the group",
    category: "admin",
    filename: __filename
},
async (conn, mek, m, { from, q, isGroup, isBotAdmins, reply, sender }) => {
    try {
        // 1. මූලික පරීක්ෂාවන් (Group & Bot Admin)
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to add members.");

        // 2. Owner Check (94760860835) - මේක වඩාත් සුරක්ෂිතයි
        const ownerNumber = "94760860835";
        if (!sender.includes(ownerNumber)) {
            return reply("❌ *Command Restricted* - Only my owner can use this.");
        }

        // 3. එකතු කළ යුතු අංකය හඳුනා ගැනීම
        let number;
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // Reply කර ඇති මැසේජ් එකේ අයිතිකරු
            number = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
        } else if (q) {
            // මෙන්ෂන් කර හෝ ටයිප් කර ඇති අංකය
            number = q.replace(/[^0-9]/g, '');
        } else {
            return reply("❌ Please reply to a message, mention a user, or provide a number.");
        }

        if (!number || number.length < 7) return reply("❌ Invalid phone number format.");

        const jid = number + "@s.whatsapp.net";

        // 4. Reaction: ➕
        await conn.sendMessage(from, { react: { text: '➕', key: mek.key } });

        // 5. සාමාජිකයා එකතු කිරීම
        const response = await conn.groupParticipantsUpdate(from, [jid], "add");

        // WhatsApp සමහර විට direct add කරන්න දෙන්නේ නැහැ (Privacy Settings නිසා)
        // එවැනි විටෙක 'invite' එකක් යැවිය යුතුයි
        if (response[0].status === "403") {
            return reply(`⚠️ @${number} cannot be added due to his Privacy settings. I sent him a 'Group Invite' privately.`, { mentions: [jid] });
        } else if (response[0].status === "200") {
            return reply(`✅ 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐀ᴅᴅᴇ𝐃 @${number}`, { mentions: [jid] });
        } else {
            return reply(`❌ Failed to add member. (Status: ${response[0].status})`);
        }

    } catch (error) {
        console.error("Add Command Error:", error);
        reply("❌ Error: Unable to add member. Most likely the number is incorrect or the person is already in the group.");
    }
});
