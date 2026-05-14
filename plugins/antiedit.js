const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    // Message save කරන කොටස
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message || mek.message.protocolMessage) return;
            const msgId = mek.key.id;
            const type = getContentType(mek.message);

            let content = "";
            if (type === "conversation") content = mek.message.conversation;
            else if (type === "extendedTextMessage") content = mek.message.extendedTextMessage.text;
            else if (type === "imageMessage") content = mek.message.imageMessage.caption || "[Image]";
            else if (type === "videoMessage") content = mek.message.videoMessage.caption || "[Video]";
            else if (type === "stickerMessage") content = "[Sticker]";
            else content = `[${type}]`;

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                // පැය 2කින් store එකෙන් අයින් කරනවා
                setTimeout(() => global.msgStore.delete(msgId), 7200000); 
            }
        } catch (e) {
            console.log("Error in antiedit onMessage:", e);
        }
    },

    // Edit detect කරන කොටස
    onEdit: async (conn, mek) => {
        try {
            // මැසේජ් එකේ protocolMessage එක තියෙන්නේ කොහේද කියලා හරියටම බලනවා
            const protocolMsg = mek.message?.protocolMessage || mek.message; 
            if (!protocolMsg || protocolMsg.type !== 14) return;

            const msgId = protocolMsg.key?.id;
            if (!msgId) return;

            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption || "[Image]";
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption || "[Video]";

            // කලින් save කරපු මැසේජ් එක ගන්නවා
            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 Original Message:*\n${oldMsg.text}\n\n` +
                             `*✒️ Edited Message:*\n${newText}\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] });
                
                // Store එක update කරනවා අලුත් එකට
                global.msgStore.set(msgId, { ...oldMsg, text: newText });
            }
        } catch (e) {
            // console.log("Edit detect error:", e);
        }
    }
};
