const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person without crashing",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Only the bot owner can use this command.");
        }

        let rawJid;
        
        // 1. Reply කරපු මැසේජ් එකකින් sender ව අල්ලගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        // 2. Mention කරපු අයගෙන් පළමු කෙනාව අල්ලගැනීම
        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            rawJid = quotedSender;
        } else if (mentionedJid.length > 0) {
            rawJid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            let cleanNumber = q.replace(/[@\s+-]/g, '');
            if (/^\d+$/.test(cleanNumber)) {
                rawJid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!rawJid) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Please mention a user, reply to their message, or type their number.");
        }

        // Clean JID
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // බොට් තමන්වම බ්ලොක් කරගන්න එක වැළැක්වීම
        const botJid = nethmina.user.id.split(":")[0] + "@s.whatsapp.net";
        if (jid === botJid) return reply("❌ You cannot block the bot itself!");

        // 🔒 SAFE WAY TO BLOCK
        await nethmina.updateBlockStatus(jid, "block");
        
        // React
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        // ❌ [CRASH PREVENT] මෙතනින් mentions සහ @ සලකුණු සම්පූර්ණයෙන්ම අයින් කර සරල text එකක් ලෙස යැවීම
        return reply(`🚫 *Successfully Blocked: ${cleanNumber}*`);

    } catch (error) {
        console.error("Block command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("❌ Error: Failed to block the user.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person without crashing",
    category: "owner",
    react: "🔓",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Only the bot owner can use this command.");
        }

        let rawJid;
        
        // Reply කරපු මැසේජ් එකකින් sender ව අල්ලගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        // Mention කරපු අයගෙන් පළමු කෙනාව අල්ලගැනීම
        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            rawJid = quotedSender;
        } else if (mentionedJid.length > 0) {
            rawJid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            let cleanNumber = q.replace(/[@\s+-]/g, '');
            if (/^\d+$/.test(cleanNumber)) {
                rawJid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!rawJid) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Please mention a user, reply to their message, or type their number.");
        }

        // Clean JID
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // 🔓 SAFE WAY TO UNBLOCK
        await nethmina.updateBlockStatus(jid, "unblock");
        
        // React
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        // ❌ [CRASH PREVENT] Plain text reply
        return reply(`🔓 *Successfully Unblocked: ${cleanNumber}*`);

    } catch (error) {
        console.error("Unblock command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("❌ Error: Failed to unblock the user.");
    }
});
