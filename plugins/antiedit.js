const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;
            
            const type = getContentType(mek.message);
            
            // Edit එකක්ද කියලා බලනවා (මෙහිදී fromMe බලන්නේ නැහැ, එතකොට ඔයාගේ ඒවත් අහුවෙනවා)
            if (type === 'protocolMessage' && mek.message.protocolMessage.type === 14) {
                if (module.exports.onEdit) {
                    return await module.exports.onEdit(conn, mek);
                }
            }

            // මැසේජ් එක Store කිරීම
            const msgId = mek.key.id;
            let content = "";
            
            if (type === "conversation") content = mek.message.conversation;
            else if (type === "extendedTextMessage") content = mek.message.extendedTextMessage.text;
            else if (type === "imageMessage") content = mek.message.imageMessage.caption || "[Image]";
            else if (type === "videoMessage") content = mek.message.videoMessage.caption || "[Video]";
            else if (type === "stickerMessage") content = "[Sticker]";
            else content = `[${type}]`;

            // මෙතන තමයි වැදගත්ම දේ: මැසේජ් එක හිස් නැත්නම් අනිවාර්යයෙන්ම Store කරනවා
            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                
                // පැය 2කින් මතකයෙන් අයින් කරනවා
                setTimeout(() => global.msgStore.delete(msgId), 7200000); 
            }
        } catch (e) {
            // console.log("Error in antiedit onMessage:", e);
        }
    },

    onEdit: async (conn, mek) => {
        try {
            const protocolMsg = mek.message.protocolMessage;
            const msgId = protocolMsg.key.id;
            const from = mek.key.remoteJid;
            
            // වැදගත්: තමන්ගේම මැසේජ් Edit එකට Bot රිප්ලයි කරන එක වළක්වන්න ඕන නම් විතරක් පහත පේළිය දාන්න. 
            // හැබැයි ඔයාට ඔයාගේ Edit බලන්න ඕන නිසා මම ඒක දාන්නේ නැහැ.
            
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption || "[Image]";
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption || "[Video]";

            const oldMsg = global.msgStore.get(msgId);

            if (oldMsg && newText && oldMsg.text !== newText) {
                // Ping වගේ Command Edit වෙන ඒවා Ignore කරන්න ඕන නම් මෙහෙම කරන්න පුළුවන්
                if (oldMsg.text.startsWith('.') || oldMsg.text.startsWith('#')) return; 

                let report = `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 Original Message:*\n${oldMsg.text}\n\n` +
                             `*✒️ Edited Message:*\n${newText}\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(from, { text: report, mentions: [oldMsg.sender] });
                global.msgStore.set(msgId, { ...oldMsg, text: newText });
            }
        } catch (e) {}
    }
};
