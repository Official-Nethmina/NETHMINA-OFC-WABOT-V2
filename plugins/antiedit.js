const fs = require('fs');
if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            // Edit එකක් හෝ Protocol එකක් නම් Store කරන්න එපා
            if (!mek.message || mek.message.protocolMessage) return;
            
            const msgId = mek.key.id;
            let content = mek.message.conversation || 
                          mek.message.extendedTextMessage?.text || 
                          mek.message.imageMessage?.caption || 
                          mek.message.videoMessage?.caption || "";

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                // පැයකට පසු මකන්න
                setTimeout(() => global.msgStore.delete(msgId), 3600000); 
            }
        } catch (e) { console.log(e); }
    },

    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message.protocolMessage;
            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;

            if (!editedMsg) return;

            const newText = editedMsg.conversation || 
                            editedMsg.extendedTextMessage?.text || 
                            editedMsg.imageMessage?.caption || 
                            editedMsg.videoMessage?.caption;

            const oldMsg = global.msgStore.get(msgId);

            // තමන්ගේම ඒවටත් වැඩ නොකරන්න ඕනෙ නම් (update.key.fromMe) check එක දාන්න පුළුවන්
            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDITED DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 𝗢𝗿𝗶𝗴𝗶𝗻𝗮𝗹 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${oldMsg.text}\`\`\`\n\n` +
                             `*✒️ 𝗘𝗱𝗶𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${newText}\`\`\`\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { 
                    text: report, 
                    mentions: [oldMsg.sender] 
                }, { quoted: mek });
                
                global.msgStore.delete(msgId);
            }
        } catch (e) { console.log("Edit Plugin Error:", e); }
    }
};
