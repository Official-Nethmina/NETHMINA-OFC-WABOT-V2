const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.message.protocolMessage) return;
            const msgId = mek.key.id;
            
            // මැසේජ් එකේ අන්තර්ගතය ලබා ගැනීම
            const type = getContentType(mek.message);
            let content = type === "conversation" ? mek.message.conversation : 
                          type === "extendedTextMessage" ? mek.message.extendedTextMessage.text : 
                          type === "imageMessage" ? mek.message.imageMessage.caption : 
                          type === "videoMessage" ? mek.message.videoMessage.caption : "";

            if (content || mek.message.imageMessage || mek.message.videoMessage) {
                global.msgStore.set(msgId, {
                    text: content || "« Media without caption »",
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                // පැයකට පසු මකන්න
                setTimeout(() => global.msgStore.delete(msgId), 3600000);
            }
        } catch (e) { console.log("AntiEdit Store Error:", e); }
    },

    onEdit: async (conn, update) => {
        try {
            const msgId = update.key.id;
            const from = update.key.remoteJid;
            const oldMsg = global.msgStore.get(msgId);
            if (!oldMsg || update.key.fromMe) return;

            // Edit කළ අලුත් මැසේජ් එකේ content එක
            const msg = update.update.message || update.update.editedMessage;
            const type = getContentType(msg);
            let newText = "";

            if (type === "protocolMessage") {
                const edit = msg.protocolMessage.editedMessage;
                const innerType = getContentType(edit);
                newText = innerType === "conversation" ? edit.conversation : 
                          innerType === "extendedTextMessage" ? edit.extendedTextMessage.text : 
                          innerType === "imageMessage" ? edit.imageMessage.caption : 
                          innerType === "videoMessage" ? edit.videoMessage.caption : "";
            }

            if (newText && oldMsg.text !== newText) {
                let report = `✍️ *Message Edited Detected*\n\n🕒 *Time:* ${oldMsg.time}\n👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n*📑 Original:* \`\`\`${oldMsg.text}\`\`\`\n\n*✒️ Edited:* \`\`\`${newText}\`\`\`\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] }, { quoted: update });
                global.msgStore.delete(msgId);
            }
        } catch (e) { }
    }
};
