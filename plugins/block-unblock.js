const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person",
    category: "owner",
    react: "🚫",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, sender, isOwner }) => {
    try {
        // Owner Check (ඔයාගේ config එකෙන් එන isOwner variable එක කෙලින්ම පාවිච්චි කිරීම)
        if (!isOwner) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Only the bot owner can use this command.");
        }

        let jid;
        
        // 1. Reply කරපු මැසේජ් එකකින් sender ව අල්ලගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        // 2. Mention කරපු අයගෙන් පළමු කෙනාව අල්ලගැනීම
        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            jid = quotedSender;
        } else if (mentionedJid.length > 0) {
            jid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            // මැසේජ් එකේ නම්බර් එකක් විතරක් හෝ @ සමඟ ටයිප් කර තිබේ නම්
            let cleanNumber = q.replace(/[@\s+-]/g, '');
            if (/^\d+$/.test(cleanNumber)) {
                jid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!jid) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Please mention a user, reply to their message, or type their number.");
        }

        // WhatsApp Block කිරීමේ නිවැරදිම Baileys function එක
        await nethmina.updateBlockStatus(jid, "block");
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        // Tag එකත් එක්ක මැසේජ් එක යැවීම
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `𝐒ᴜᴄᴄᴇꜱ|ꜱꜰᴜʟʟ𝐘 𝐁ʟᴏᴄᴋᴇ𝐃 @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Block command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("Failed to block the user.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person",
    category: "owner",
    react: "🔓",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, sender, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Only the bot owner can use this command.");
        }

        let jid;
        
        // Reply කරපු මැසේජ් එකකින් sender ව අල්ලගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        // Mention කරපු අයගෙන් පළමු කෙනාව අල්ලගැනීම
        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            jid = quotedSender;
        } else if (mentionedJid.length > 0) {
            jid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            let cleanNumber = q.replace(/[@\s+-]/g, '');
            if (/^\d+$/.test(cleanNumber)) {
                jid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!jid) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            return reply("Please mention a user, reply to their message, or type their number.");
        }

        // WhatsApp Unblock කිරීමේ නිවැරදිම Baileys function එක
        await nethmina.updateBlockStatus(jid, "unblock");
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        // Tag එකත් එක්ක මැසේජ් එක යැවීම
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `𝐒ᴜᴄᴄᴇꜱ|ꜱꜰᴜʟʟ𝐘 𝐔ɴʙʟᴏᴄᴋᴇ𝐃 @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Unblock command error:", error);
        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
        reply("Failed to unblock the user.");
    }
});
