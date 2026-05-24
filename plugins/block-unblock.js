const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person bypass crash",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) return await reply("❌ You are not the owner!");

        let rawJid;
        
        // Reply හෝ Mention හෝ Text එකෙන් JID එක ගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            rawJid = quotedSender;
        } else if (mentionedJid.length > 0) {
            rawJid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            let cleanNumber = q.replace(/[^0-9]/g, '');
            if (cleanNumber.length > 0) {
                rawJid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!rawJid) return await reply("❌ Please reply to a message, mention, or type a number.");

        // Clean JID
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // බොට් තමන්වම බ්ලොක් කරගැනීම වැළැක්වීම
        const botJid = nethmina.user.id.split(":")[0] + "@s.whatsapp.net";
        if (jid === botJid) return await reply("❌ You cannot block the bot itself!");

        // 🔥 BYPASS WAY: කෙලින්ම වට්ස්ඇප් සර්වර් එකට බ්ලොක් රික්වෙස්ට් නෝඩ් එකක් යැවීම
        await nethmina.sendNode({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'w:privacy'
            },
            content: [
                {
                    tag: 'item',
                    attrs: {
                        value: jid,
                        action: 'block'
                    }
                }
            ]
        });

        return await reply(`🚫 User ${cleanNumber} blocked successfully.`);

    } catch (error) {
        console.error("Block Crash Bypass Error:", error);
        return await reply("❌ Internal Error: Could not process block.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person bypass crash",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) return await reply("❌ You are not the owner!");

        let rawJid;
        
        // Reply හෝ Mention හෝ Text එකෙන් JID එක ගැනීම
        const quotedSender = mek.message?.extendedTextMessage?.contextInfo?.participant || 
                             mek.message?.imageMessage?.contextInfo?.participant || 
                             mek.message?.videoMessage?.contextInfo?.participant || 
                             mek.message?.documentMessage?.contextInfo?.participant || 
                             mek.message?.audioMessage?.contextInfo?.participant;

        const mentionedJid = mek.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (quotedSender) {
            rawJid = quotedSender;
        } else if (mentionedJid.length > 0) {
            rawJid = mentionedJid[0];
        } else if (q && q.trim().length > 0) {
            let cleanNumber = q.replace(/[^0-9]/g, '');
            if (cleanNumber.length > 0) {
                rawJid = `${cleanNumber}@s.whatsapp.net`;
            }
        }

        if (!rawJid) return await reply("❌ Please reply to a message, mention, or type a number.");

        // Clean JID
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // 🔥 BYPASS WAY: කෙලින්ම වට්ස්ඇප් සර්වර් එකට අන්බ්ලොක් රික්වෙස්ට් නෝඩ් එකක් යැවීම
        await nethmina.sendNode({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'w:privacy'
            },
            content: [
                {
                    tag: 'item',
                    attrs: {
                        value: jid,
                        action: 'unblock'
                    }
                }
            ]
        });

        return await reply(`🔓 User ${cleanNumber} unblocked successfully.`);

    } catch (error) {
        console.error("Unblock Crash Bypass Error:", error);
        return await reply("❌ Internal Error: Could not process unblock.");
    }
});
