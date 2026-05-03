const fs = require('fs');
if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            const msgId = mek.key.id;
            const from = mek.key.remoteJid;
            
            // මැසේජ් එකේ text එක අරගමු
            let content = mek.message?.conversation || 
                          mek.message?.extendedTextMessage?.text || 
                          mek.message?.imageMessage?.caption || 
                          mek.message?.videoMessage?.caption || "";

            if (content && !mek.message.protocolMessage) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid
                });
            }
        } catch (e) { console.log(e); }
    },

    onEdit: async (conn, mek) => {
        try {
            // Edit එකකදී පරණ ID එක තියෙන්නේ මෙතන
            const msgId = mek.message.protocolMessage.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = mek.message.protocolMessage.editedMessage;

            if (!editedMsg) return;

            const newText = editedMsg.conversation || 
                            editedMsg.extendedTextMessage?.text || 
                            editedMsg.imageMessage?.caption || 
                            editedMsg.videoMessage?.caption;

            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `*⚠️ ANTI-EDIT DETECTED!* ⚠️\n\n` +
                             `*🚫 Original:* ${oldMsg.text}\n\n` +
                             `*✅ Edited To:* ${newText}`;

                await conn.sendMessage(from, { text: report }, { quoted: mek });
                global.msgStore.delete(msgId);
            }
        } catch (e) { console.log("Edit Plugin Error:", e); }
    }
};
