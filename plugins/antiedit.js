const fs = require('fs');

// මැසේජ් තාවකාලිකව මතක තබා ගැනීමට (Memory Store)
if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    // 1. මැසේජ් එකක් ආපු ගමන් ඒක මතක තබා ගැනීම
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;
            const msgId = mek.key.id;
            
            // මැසේජ් එකේ අන්තර්ගතය ලබා ගැනීම
            let content = mek.message.conversation || 
                          mek.message.extendedTextMessage?.text || 
                          mek.message.imageMessage?.caption || 
                          mek.message.videoMessage?.caption || "";

            // මැසේජ් එක Store එකට දැමීම
            global.msgStore.set(msgId, {
                text: content,
                sender: mek.key.participant || mek.key.remoteJid,
                time: Date.now()
            });

            // Store එක ඕනෑවට වඩා පිරෙන එක වැළැක්වීමට පැයකට පසු මැකීම
            setTimeout(() => global.msgStore.delete(msgId), 3600000);
        } catch (e) {
            console.log("Error in Anti-Edit Store:", e);
        }
    },

    // 2. මැසේජ් එක Edit වුණු විට ක්‍රියාත්මක වීම
    onEdit: async (conn, update) => {
        try {
            const msgId = update.key.id;
            const from = update.key.remoteJid;
            const newText = update.update.message.protocolMessage.editedMessage.conversation || 
                            update.update.message.protocolMessage.editedMessage.extendedTextMessage?.text;

            // පරණ මැසේජ් එක අපේ Store එකේ තියෙනවාද බැලීම
            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && oldMsg.text !== newText) {
                const senderName = update.pushName || oldMsg.sender.split('@')[0];

                let report = `*⚠️ ANTI-EDIT DETECTED!* ⚠️\n\n` +
                             `*👤 Sender:* ${senderName}\n` +
                             `*🚫 Original Message:* \n${oldMsg.text}\n\n` +
                             `*✅ Edited To:* \n${newText}`;

                await conn.sendMessage(from, { text: report }, { quoted: update });
                
                // Update එකෙන් පසු Store එකෙන් ඉවත් කිරීම
                global.msgStore.delete(msgId);
            }
        } catch (e) {
            console.log("Error in Anti-Edit Plugin:", e);
        }
    }
};
