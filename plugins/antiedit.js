const fs = require('fs');

// පරණ මැසේජ් මතක තබා ගැනීමට (RAM එකේ තාවකාලිකව)
if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    // සෑම මැසේජ් එකක්ම Store කරගැනීම
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.message.protocolMessage) return;
            const msgId = mek.key.id;
            
            let content = mek.message.conversation || 
                          mek.message.extendedTextMessage?.text || 
                          mek.message.imageMessage?.caption || 
                          mek.message.videoMessage?.caption || "";

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid
                });
            }
            
            // පැයකට පසු Memory එකෙන් අයින් කිරීම
            setTimeout(() => global.msgStore.delete(msgId), 3600000); 
        } catch (e) { console.log(e); }
    },

    // Edit එකක් වූ විට ක්‍රියාත්මක වීම
    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message.protocolMessage;
            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;

            if (!editedMsg) return;

            // අලුත් (Edit කරපු) Text එක
            const newText = editedMsg.conversation || 
                            editedMsg.extendedTextMessage?.text || 
                            editedMsg.imageMessage?.caption || 
                            editedMsg.videoMessage?.caption;

            // පරණ (Store කරපු) මැසේජ් එක
            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `*⚠️ ANTI-EDIT DETECTED!* ⚠️\n\n` +
                             `*🚫 Original:* ${oldMsg.text}\n\n` +
                             `*✅ Edited To:* ${newText}`;

                await conn.sendMessage(from, { text: report }, { quoted: mek });
                
                // දැනුම් දුන්නට පස්සේ Store එකෙන් අයින් කරන්න පුළුවන්
                global.msgStore.delete(msgId);
            }
        } catch (e) { console.log("Edit Plugin Error:", e); }
    }
};
