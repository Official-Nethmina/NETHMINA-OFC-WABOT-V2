const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.message.protocolMessage) return;
            
            const msgId = mek.key.id;
            const type = getContentType(mek.message);
            
            let content = "";
            if (type === "conversation") content = mek.message.conversation;
            else if (type === "extendedTextMessage") content = mek.message.extendedTextMessage.text;
            else if (type === "imageMessage") content = mek.message.imageMessage.caption;
            else if (type === "videoMessage") content = mek.message.videoMessage.caption;

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                // පැය 2කින් memory එකෙන් අයින් කරයි
                setTimeout(() => global.msgStore.delete(msgId), 7200000);
            }
        } catch (e) { console.log("AntiEdit Store Error:", e); }
    },

    onEdit: async (conn, update) => {
        try {
            const msgId = update.key.id;
            const from = update.key.remoteJid;
            const oldMsg = global.msgStore.get(msgId);
            
            // පරණ මැසේජ් එක ස්ටෝර් එකේ නැත්නම් හෝ තමන්ම Edit කළ එකක් නම් නවත්වන්න
            if (!oldMsg || update.key.fromMe) return;

            // Edit කළ අලුත් මැසේජ් එක ලබා ගැනීම
            const protocolMsg = update.update.message.protocolMessage;
            if (!protocolMsg || protocolMsg.type !== 14) return; 

            const editedMsg = protocolMsg.editedMessage;
            const type = getContentType(editedMsg);
            
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption;
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption;

            // පරණ එක සහ අලුත් එක වෙනස් නම් පමණක් මැසේජ් එක යවන්න
            if (newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDITED DETECTED*\n\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n` +
                             `🕒 *Time:* ${oldMsg.time}\n\n` +
                             `*📑 Original:* \n\`\`\`${oldMsg.text}\`\`\`\n\n` +
                             `*✒️ Edited:* \n\`\`\`${newText}\`\`\`\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { 
                    text: report, 
                    mentions: [oldMsg.sender] 
                }, { quoted: update });
                
                // එක පාරක් Report කළාට පස්සේ අයින් කරන්න
                global.msgStore.delete(msgId);
            }
        } catch (e) { 
            console.log("AntiEdit Logic Error:", e); 
        }
    }
};
