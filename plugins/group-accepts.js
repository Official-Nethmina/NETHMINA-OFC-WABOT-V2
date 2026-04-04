const { cmd } = require('../command');

// ====================== 1. LIST REQUESTS ======================
cmd({
    pattern: "requestlist",
    alias: ["listrequest", "requests"],
    desc: "Shows pending group join requests",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to view join requests.");

        // Reaction: ⏳
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Pending Requests ලබා ගැනීම
        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) {
            await conn.sendMessage(from, { react: { text: 'ℹ️', key: mek.key } });
            return reply("ℹ️ *𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙹𝙾𝙸𝙽 𝚁𝙴𝚀𝚄𝙴𝚂𝚃𝚂.*");
        }

        let text = `📋 *ＰᴇɴᴅɪɴＧ ＪᴏɪＮ ＲᴇQᴜᴇꜱᴛＳ (${requests.length})*\n\n`;
        const mentions = [];

        requests.forEach((user, i) => {
            text += `${i + 1}. @${user.jid.split('@')[0]}\n`;
            mentions.push(user.jid);
        });

        text += `\n*Use .acceptall or .rejectall to manage.*`;

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(text, { mentions });

    } catch (error) {
        console.error("Request list error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return reply("❌ *Error:* Failed to fetch requests. Make sure 'Approve New Members' is ON in group settings.");
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
async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to manage requests.");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) {
            return reply("ℹ️ *𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙹𝙾𝙸𝙽 𝚁𝙴𝚀𝚄𝙴𝚂𝚃𝚂 𝚃𝙾 𝙰𝙲𝙲𝙴𝙿𝚃.*");
        }

        for (let user of requests) {
            await conn.groupRequestParticipantsUpdate(from, [user.jid], "approve");
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(`✅ *𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐀ᴄᴄᴇᴘᴛᴇ𝐃 ${requests.length} 𝐉ᴏɪ𝐍 𝐑ᴇQᴜᴇꜱᴛ𝐒.*`);

    } catch (error) {
        console.error("Accept all error:", error);
        return reply("❌ *Error:* Failed to approve requests.");
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
async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        const isGroupChat = from.endsWith('@g.us');
        if (!isGroupChat) return reply("❌ This command can only be used in groups.");
        if (!isAdmins) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmins) return reply("❌ I need to be an admin to manage requests.");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const requests = await conn.groupRequestParticipantsList(from);
        
        if (!requests || requests.length === 0) {
            return reply("ℹ️ *𝙽𝙾 𝙿𝙴𝙽𝙳𝙸𝙽𝙶 𝙹𝙾𝙸𝙽 𝚁𝙴𝚀𝚄𝙴𝚂𝚃𝚂 𝚃𝙾 𝚁𝙴𝙹𝙴𝙲𝚃.*");
        }

        for (let user of requests) {
            await conn.groupRequestParticipantsUpdate(from, [user.jid], "reject");
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return reply(`✅ *𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐑ᴇᴊᴇᴄᴛᴇ𝐃 ${requests.length} 𝐉ᴏɪ𝐍 𝐑ᴇQᴜᴇꜱᴛ𝐒.*`);

    } catch (error) {
        console.error("Reject all error:", error);
        return reply("❌ *Error:* Failed to reject requests.");
    }
});
