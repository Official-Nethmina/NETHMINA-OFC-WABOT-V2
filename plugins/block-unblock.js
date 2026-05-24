const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person",
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

        // 🎯 Multi-device (e.g. :14@s.whatsapp.net) පිරිසිදු කර සැබෑ JID එක ගැනීම
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";

        // WhatsApp බ්ලොක් කිරීමේ නියමිත function එක
        await nethmina.updateBlockStatus(jid, "block");
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `🚫 𝐒ᴜᴄᴄᴇꜱꜱꜰᴜʟʟ𝐘 𝐁ʟᴏᴄᴋᴇ𝐃 @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Block command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("Failed to block the user. Make sure it's a valid PM user.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person",
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

        // 🎯 Multi-device පිරිසිදු කර සැබෑ JID එක ගැනීම
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";

        // WhatsApp අන්බ්ලොක් කිරීමේ නියමිත function එක
        await nethmina.updateBlockStatus(jid, "unblock");
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `🔓 𝐒u𝐜𝐜e𝐬𝐬f𝐮𝐥𝐥y 𝐔n𝐛𝐥o𝐜𝐤e𝐃 @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Unblock command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("Failed to unblock the user.");
    }
});
