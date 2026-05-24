const { cmd } = require('../command');

cmd({
    pattern: "block",
    desc: "Blocks a person safely",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) return await reply("❌ You are not the owner!");

        let rawJid;
        
        // Reply කරපු මැසේජ් එකකින් හෝ Mention එකකින් හෝ text එකෙන් JID එක අල්ලගැනීම
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

        if (!rawJid) return await reply("❌ Please mention a user, reply to their message, or type their number.");

        // Multi-device කෑලි අයින් කර පිරිසිදු JID එක ගැනීම
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // බොට් තමන්වම බ්ලොක් කරගන්න එක වැළැක්වීම
        const botJid = nethmina.user.id.split(":")[0] + "@s.whatsapp.net";
        if (jid === botJid) return await reply("❌ You cannot block the bot itself!");

        // 🔒 updateBlockStatus මඟින් සෘජුවම බ්ලොක් කිරීම
        await nethmina.updateBlockStatus(jid, 'block')
            .then(async () => {
                await reply(`🚫 User ${cleanNumber} blocked successfully.`);
            })
            .catch(async (err) => {
                await reply(`❌ Failed to block user: ${err.message || err}`);
            });

    } catch (error) {
        console.error("Block command error:", error);
        await reply("❌ An error occurred while processing the block command.");
    }
});

cmd({
    pattern: "unblock",
    desc: "Unblocks a person safely",
    category: "owner",
    filename: __filename
},
async (nethmina, mek, msg, { reply, q, isOwner }) => {
    try {
        // Owner Check
        if (!isOwner) return await reply("❌ You are not the owner!");

        let rawJid;
        
        // Reply කරපු මැසේජ් එකකින් හෝ Mention එකකින් හෝ text එකෙන් JID එක අල්ලගැනීම
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

        if (!rawJid) return await reply("❌ Please mention a user, reply to their message, or type their number.");

        // Multi-device කෑලි අයින් කර පිරිසිදු JID එක ගැනීම
        const jid = rawJid.split(":")[0] + "@s.whatsapp.net";
        const cleanNumber = jid.split("@")[0];

        // 🔓 updateBlockStatus මඟින් සෘජුවම අන්බ්ලොක් කිරීම
        await nethmina.updateBlockStatus(jid, 'unblock')
            .then(async () => {
                await reply(`🔓 User ${cleanNumber} unblocked successfully.`);
            })
            .catch(async (err) => {
                await reply(`❌ Failed to unblock user: ${err.message || err}`);
            });

    } catch (error) {
        console.error("Unblock command error:", error);
        await reply("❌ An error occurred while processing the unblock command.");
    }
});
