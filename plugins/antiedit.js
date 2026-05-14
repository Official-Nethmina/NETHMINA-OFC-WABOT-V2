const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;

            const type = getContentType(mek.message);
            const msgId = mek.key.id;

            // 1. Edit එකක්ද කියලා බලනවා
            if (type === 'protocolMessage' && mek.message.protocolMessage.type === 14) {
                console.log("DEBUG: Edit Message Received for ID:", mek.message.protocolMessage.key.id);
                if (module.exports.onEdit) {
                    return await module.exports.onEdit(conn, mek);
                }
            }

            // 2. මැසේජ් එකේ තියෙන්නේ මොනවද කියලා අහු කරගන්නවා
            let content = "";
            if (type === "conversation") content = mek.message.conversation;
            else if (type === "extendedTextMessage") content = mek.message.extendedTextMessage.text;
            else if (type === "imageMessage") content = mek.message.imageMessage.caption;
            else if (type === "videoMessage") content = mek.message.videoMessage.caption;
            else if (mek.message[type]) content = mek.message[type].text || mek.message[type].caption || "";

            if (content) {
                // Console එකේ බලන්න මේක වැටෙනවද කියලා
                console.log("DEBUG: Message Stored! ID:", msgId, "Content:", content.substring(0, 10));
                
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });

                setTimeout(() => {
                    if (global.msgStore.has(msgId)) global.msgStore.delete(msgId);
                }, 3600000); // පැයක් තියාගන්නවා
            }

        } catch (e) {
            console.log("Antiedit Storage Error:", e);
        }
    },

    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message.protocolMessage;
            const targetId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption;
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption;
            else if (editedMsg[type]) newText = editedMsg[type].text || editedMsg[type].caption || "";

            const oldMsg = global.msgStore.get(targetId);

            // Ping Edit එක Ignore කරනවා
            if (oldMsg && (oldMsg.text.includes("Pinging...") || oldMsg.text.startsWith("🚀"))) return;

            if (oldMsg && newText && oldMsg.text !== newText) {
                console.log("DEBUG: Sending Edit Report for ID:", targetId);

                let report = `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 Original Message:*\n${oldMsg.text}\n\n` +
                             `*✒️ Edited Message:*\n${newText}\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] });
                global.msgStore.set(targetId, { ...oldMsg, text: newText });
            } else {
                console.log("DEBUG: Edit detected but Original Message not found in Store!");
            }
        } catch (e) {
            console.log("Antiedit Detection Error:", e);
        }
    }
};
