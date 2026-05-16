const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    onMessage: async (conn, mek) => {
        try {
            if (!mek.message) return;

            const type = getContentType(mek.message);
            const msgId = mek.key.id;

            let content = "";
            if (type === "conversation") content = mek.message.conversation;
            else if (type === "extendedTextMessage") content = mek.message.extendedTextMessage.text;
            else if (type === "imageMessage") content = mek.message.imageMessage.caption;
            else if (type === "videoMessage") content = mek.message.videoMessage.caption;
            else if (mek.message[type]) content = mek.message[type].text || mek.message[type].caption || "";

            if (content) {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });

                setTimeout(() => {
                    if (global.msgStore.has(msgId)) global.msgStore.delete(msgId);
                }, 3600000); 
            }
        } catch (e) {
            console.log("Antiedit Storage Error:", e);
        }
    },

    onEdit: async (conn, update, reportTarget) => { 
        try {
            // update එක ඇතුළේ දත්ත තියෙනවද බලනවා
            if (!update || !update.update) return;
            const rawMsg = update.update.message;
            if (!rawMsg) return;

            // ඔයාගේ Baileys Version එකේ protocolMessage එක තියෙන්නේ මෙතනයි
            const protocolMsg = rawMsg.protocolMessage;
            if (!protocolMsg) return;
            
            // type 14 = WhatsApp Message Edit Protocol
            if (protocolMsg.type !== 14 && protocolMsg.type !== 'EDIT') return;

            const targetId = protocolMsg.key ? protocolMsg.key.id : null;
            if (!targetId) return;

            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            // පරණ මැසේජ් එක අපේ Store එකෙන් ගන්නවා
            const oldMsg = global.msgStore.get(targetId);
            if (!oldMsg) return;

            // එඩිට් කරපු අලුත් Text එක වෙන් කරගන්නවා
            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption;
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption;
            else if (editedMsg[type]) newText = editedMsg[type].text || editedMsg[type].caption || "";

            // බොට්ගේම පිං මැසේජ් හෝ ස්වයංක්‍රීය මැසේජ් එඩිට් ඉග්නෝර් කරනවා
            if (oldMsg.text.includes("Pinging...") || oldMsg.text.startsWith("🚀")) return;

            // ඇත්තටම අකුරක් හරි වෙනස් වෙලා නම් විතරක් Report කරනවා
            if (newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDIT DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 Original Message:*\n${oldMsg.text}\n\n` +
                             `*✒️ Edited Message:*\n${newText}\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                await conn.sendMessage(reportTarget || update.key.remoteJid, { 
                    text: report, 
                    mentions: [oldMsg.sender] 
                });
                
                // Store එක Update කරනවා
                global.msgStore.set(targetId, { ...oldMsg, text: newText });
            }
        } catch (e) {
            console.log("Antiedit Detection Error:", e);
        }
    }
};
