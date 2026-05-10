const { getContentType } = require("@whiskeysockets/baileys");

if (!global.msgStore) global.msgStore = new Map();

module.exports = {
    // සාමාන්‍ය මැසේජ් එකක් ආපු ගමන් ඒක මතක තබා ගැනීම
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

            if (content && content.trim() !== "") {
                global.msgStore.set(msgId, {
                    text: content,
                    sender: mek.key.participant || mek.key.remoteJid,
                    time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: true })
                });
                // පැය 2කින් Memory එකෙන් අයින් කරන්න
                setTimeout(() => global.msgStore.delete(msgId), 7200000);
            }
        } catch (e) { console.log("Store Error:", e); }
    },

    // මැසේජ් එක Edit වුණු බව හඳුනාගත් විට ක්‍රියාත්මක වීම
    onEdit: async (conn, update) => {
        try {
            // index.js එකෙන් එන දත්ත නිවැරදිව වෙන් කර ගැනීම
            const protocolMsg = update.update?.message?.protocolMessage;
            if (!protocolMsg || protocolMsg.type !== 14) return;

            const msgId = protocolMsg.key.id;
            const from = update.key.remoteJid;
            const editedMsg = protocolMsg.editedMessage;
            if (!editedMsg) return;

            const type = getContentType(editedMsg);
            let newText = "";
            if (type === "conversation") newText = editedMsg.conversation;
            else if (type === "extendedTextMessage") newText = editedMsg.extendedTextMessage.text;
            else if (type === "imageMessage") newText = editedMsg.imageMessage.caption;
            else if (type === "videoMessage") newText = editedMsg.videoMessage.caption;

            const oldMsg = global.msgStore.get(msgId);

            // පරණ එක තිබේ නම් සහ එය අලුත් එකට වඩා වෙනස් නම් පමණක් Report කරන්න
            if (oldMsg && newText && oldMsg.text !== newText) {
                let report = `✍️ *MESSAGE EDITED DETECTED*\n\n` +
                             `🕒 *Time:* ${oldMsg.time}\n` +
                             `👤 *User:* @${oldMsg.sender.split('@')[0]}\n\n` +
                             `*📑 𝗢𝗿𝗶𝗴𝗶𝗻𝗮𝗹 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${oldMsg.text}\`\`\`\n\n` +
                             `*✒️ 𝗘𝗱𝗶𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲:*\n` +
                             `\`\`\`${newText}\`\`\`\n\n` +
                             `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴᴇᴛʜᴍɪɴᴀ ᴏꜰᴄ`;

                // update object එක කෙලින්ම quoted එකට දිය නොහැක, එය key එකක් පමණි.
                await conn.sendMessage(from, { 
                    text: report, 
                    mentions: [oldMsg.sender] 
                });
                
                global.msgStore.delete(msgId);
            }
        } catch (e) { 
            // console.log("Edit Process Error:", e); 
        }
    }
};
