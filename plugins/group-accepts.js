const { cmd } = require('../command');

// ====================== 1. LIST REQUESTS ======================
cmd({
    pattern: "requestlist",
    alias: ["listrequest", "requests"],
    desc: "Shows pending group join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender }) => { // <--- මෙතනට sender එකතු කළා
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        // Bot Admin Check
        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        const isBotActuallyAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');

        if (!isBotActuallyAdmin) return reply("❌ I need to be an admin to perform this action.");

        // User Admin Check
        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        const isUserActuallyAdmin = userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin');

        if (!isUserActuallyAdmin) return reply("❌ Only group admins can use this command.");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) {
            await conn.sendMessage(from, { react: { text: 'ℹ️', key: mek.key } });
            return reply("ℹ️ *𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙹𝙾𝙸𝙽 𝚁𝙴𝚀𝚄𝙴𝚂𝚃𝚂.*");
        }

        let text = `📋 *ＰᴇɴᴅɪɴＧ ＪᴏɪＮ ＲᴇQᴜᴇꜱᴛＳ (${requests.length})*\n\n`;
        const mentions = requests.map(u => u.jid);

        requests.forEach((user, i) => {
            text += `${i + 1}. @${user.jid.split('@')[0]}\n`;
        });

        text += `\n*Use .acceptall or .rejectall to manage.*`;

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(text, { mentions });

    } catch (error) {
        console.error("Request list error:", error);
        reply("❌ *Error:* Failed to fetch requests.");
    }
});

// ====================== 2. ACCEPT ALL ======================
cmd({
    pattern: "acceptall",
    alias: ["approveall"],
    desc: "Accepts all pending group join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender }) => { // <--- මෙතනටත් sender එකතු කළා
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        if (!(botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'))) {
            return reply("❌ I need to be an admin to perform this action.");
        }

        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        if (!(userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin'))) {
            return reply("❌ Only group admins can use this command.");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return reply("ℹ️ No pending requests.");

        for (let user of requests) {
            await conn.groupRequestParticipantsUpdate(from, [user.jid], "approve");
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(`✅ *𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐀ᴄᴄᴇᴘᴛᴇ𝐃 ${requests.length} 𝐉ᴏɪ𝐍 𝐑ᴇQᴜᴇꜱᴛ𝐒.*`);

    } catch (error) {
        reply("❌ *Error:* Failed to approve requests.");
    }
});

// ====================== 3. REJECT ALL ======================
cmd({
    pattern: "rejectall",
    alias: ["dismissall"],
    desc: "Rejects all pending group join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, reply, sender }) => { // <--- මෙතනටත් sender එකතු කළා
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;

        const botNumber = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botParticipant = participants.find(p => p.id === botNumber);
        if (!(botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin'))) {
            return reply("❌ I need to be an admin to perform this action.");
        }

        const userParticipant = participants.find(p => p.id === sender.split(":")[0] + "@s.whatsapp.net");
        if (!(userParticipant && (userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin'))) {
            return reply("❌ Only group admins can use this command.");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) return reply("ℹ️ No pending requests.");

        for (let user of requests) {
            await conn.groupRequestParticipantsUpdate(from, [user.jid], "reject");
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(`✅ *𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐑ᴇᴊᴇᴄᴛᴇ𝐃 ${requests.length} 𝐉ᴏɪ𝐍 𝐑ᴇQᴜᴇꜱᴛ𝐒.*`);

    } catch (error) {
        reply("❌ *Error:* Failed to reject requests.");
    }
});
