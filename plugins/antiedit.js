const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;
            
            const type = getContentType(mek.message);
            
            // 1. Edit එකක්ද කියලා බලනවා
            if (type === 'protocolMessage' && mek.message.protocolMessage.type === 14) {
                if (module.exports.onEdit) {
                    return await module.exports.onEdit(conn, mek);
                }
            }

            // 2. මැසේජ් එකේ Content එක ගන්නවා
            // සමහර වෙලාවට viewOnce හෝ වෙනත් තැන් වල content එක හැංගිලා තිබුණොත් ඒක ගන්නවා
            const msg = mek.message.extendedTextMessage || mek.message.conversation || mek.message;
            const msgId = mek.key.id;
            
            let content = "";
            if (mek.message.conversation) content = mek.message.conversation;
            else if (mek.message.extendedTextMessage) content = mek.message.extendedTextMessage.text;
            else if (mek.message.imageMessage) content = mek.message.imageMessage.caption || "[Image]";
            else if (mek.message.videoMessage) content = mek.message.videoMessage.caption || "[Video]";
            else if (type.includes("Message")) content = mek.message[type]?.caption || mek.message[type]?.text || `[${type}]`;

            // මැසේජ් එක Store කරනවා
            if (content && content !== "") {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                
                // පැය 2කින් Delete කරනවා
                setTimeout(() => global.msgStore.delete(msgId), 7200000);
            }
        } catch (e) {
            console.log("Antiedit Storage Error:", e);
        }
    },

    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message.protocolMessage;
            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption || "[Image]";
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption || "[Video]";
            else newText = editedMsg[type]?.caption || editedMsg[type]?.text || "";

            const oldMsg = global.msgStore.get(msgId);

            // Ping edit එක ignore කරන්න (නැත්නම් කරදරයක්නේ)
            if (oldMsg && oldMsg.text.includes("Pinging...")) return;

            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 Original Message:*\n${oldMsg.text}\n\n` +
                             `*✒️ Edited Message:*\n${newText}\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] });
                global.msgStore.set(msgId, { ...oldMsg, text: newText });
            }
        } catch (e) {
            console.log("Antiedit Detection Error:", e);
        }
    }
};
