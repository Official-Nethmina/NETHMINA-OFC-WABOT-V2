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
                setTimeout(() => global.msgStore.delete(msgId), 7200000);
            }
        } catch (e) {}
    },

    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message?.protocolMessage;
            if (!protocolMsg || protocolMsg.type !== 14) return;

            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption;
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption;

            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDITED DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 𝗢𝗿𝗶𝗴𝗶𝗻𝗮𝗹 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${oldMsg.text}\`\`\`\n\n` +
                             `*✒️ 𝗘𝗱𝗶𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${newText}\`\`\`\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] });
                global.msgStore.delete(msgId);
            }
        } catch (e) {}
    }
};
