const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person safely",
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

        // 🎯 Multi-device පිරිසිදු කර සැබෑ JID එක ගැනීම
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";

        // බොට් තමන්වම බ්ලොක් කරගන්න එක වැළැක්වීම
        const botJid = nethmina.user.id.split(":")[0] + "@s.whatsapp.net";
        if (jid === botJid) return reply("❌ You cannot block the bot itself!");

        // 🔥 CRASH-PROOF WAY: Baileys query එකක් මඟින් සෘජුවම බ්ලොක් කිරීම
        await nethmina.query({
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

        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `🚫 *𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘 𝐁𝐋𝐎𝐂𝐊𝐄𝐃*\n\nUser: @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Block command error:", error);
        
        // ක්‍රෑෂ් නොවී ගොඩදාන්න දෙවැනි විකල්පය (Fallback)
        try {
            await nethmina.updateBlockStatus(jid, "block");
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        } catch (err) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            reply("❌ Error: Failed to block the user.");
        }
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person safely",
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

        // 🔥 CRASH-PROOF WAY: Baileys query එකක් මඟින් සෘජුවම අන්බ්ලොක් කිරීම
        await nethmina.query({
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

        await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        
        await nethmina.sendMessage(mek.key.remoteJid, {
            text: `🔓 *𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘 𝐔𝐍𝐁𝐋𝐎𝐂𝐊𝐄𝐃*\n\nUser: @${jid.split("@")[0]}`,
            mentions: [jid]
        }, { quoted: mek });

    } catch (error) {
        console.error("Unblock command error:", error);
        
        // Fallback Way
        try {
            await nethmina.updateBlockStatus(jid, "unblock");
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "✅", key: mek.key } });
        } catch (err) {
            await nethmina.sendMessage(mek.key.remoteJid, { react: { text: "❌", key: mek.key } });
            reply("❌ Error: Failed to unblock the user.");
        }
    }
});
